import { GoogleGenAI, Part } from "@google/genai";
import { IdentifiedPlayer, IdentifiedTeam } from "../core/interfaces/video-analysis.interfaces";
import { IVideoIntelligenceProvider, VideoChunkInfo, AnalysisResult } from "../core/interfaces/IVideoIntelligenceProvider";
import { GameType, IdentityMode } from "../core/entities/Game";
import { PromptLoader } from "./PromptLoader";
import { EVENT_SCHEMA } from "../constants/gemini";
import { ILogger } from "../core/interfaces/ILogger";

export class GeminiProvider implements IVideoIntelligenceProvider {
    private genAI: GoogleGenAI;

    constructor(
        apiKey: string,
        private modelName: string,
        private logger?: ILogger
    ) {
        this.genAI = new GoogleGenAI({ apiKey });
    }

    public async analyzeVideoChunk(
        chunk: VideoChunkInfo,
        knownPlayers: IdentifiedPlayer[],
        knownTeams: IdentifiedTeam[],
        visualContext?: string,
        gameType: GameType = GameType.FULL_COURT,
        identityMode: IdentityMode = IdentityMode.JERSEY_COLORS,
        chatHistory: any[] = []
    ): Promise<AnalysisResult> {
        const { chunkPath, startTime, endTime, fileUri, fileName: existingFileName } = chunk;
        this.logger?.info(`[GeminiProvider] Starting analysis for ${chunkPath} (Offset: ${startTime}s - ${endTime}s)`, { 
            phase: 'analyzing', 
            gameType, 
            identityMode,
            historyTurns: chatHistory.length 
        });

        let uploadedFileName: string | null = null;
        let finalFileUri = fileUri;

        try {
            // 1. Upload File (if not already provided)
            if (!finalFileUri) {
                const uploadResponse = await this.genAI.files.upload({
                    file: chunkPath,
                    config: { mimeType: 'video/mp4' }
                });
                const fileName = uploadResponse.name;
                if (!fileName) {
                    throw new Error("File upload failed: No filename returned from Gemini API");
                }
                uploadedFileName = fileName;

                // 2. Poll for ACTIVE state
                await this.waitForFileActive(fileName);
                
                const file = await this.genAI.files.get({ name: fileName });
                finalFileUri = file.uri;
            }

            // 3. Build Multi-turn Conversation using PromptLoader
            const formatInstructions = PromptLoader.getRulesetInstruction(gameType);
            const identityInstructions = PromptLoader.getRulesetInstruction(identityMode);

            const systemInstructionText = PromptLoader.loadPrompt('system_instruction', {
                visualContext: visualContext || 'No additional context provided.',
                formatInstructions,
                identityInstructions
            });

            const isFirstChunk = chatHistory.length === 0;
            let userPrompt = "";

            if (isFirstChunk) {
                userPrompt = PromptLoader.loadPrompt('first_chunk');
            } else {
                userPrompt = PromptLoader.loadPrompt('subsequent_chunk', {
                    sequence: chunk.sequence.toString()
                });
            }

            // --- STRICT MULTI-TURN CONSISTENCY RULE ---
            userPrompt += `\n\n### CRITICAL INSTRUCTIONS FOR CONSISTENCY:
1. **Reuse Known Entities**: You MUST first look at the 'KNOWN TEAMS' and 'KNOWN PLAYERS' lists provided below. 
2. **Event Attribution**: For every event you identify, try to attribute it to an existing ID from these lists (e.g., 'TEMP_PLAYER_5' or 'TEMP_TEAM_1').
3. **Adding New Entities**: Only if you are 100% certain a player/team is NOT in the lists, add a NEW entry to the 'identifiedTeams' or 'players' array and generate a new TEMP ID.
4. **Maintain the Roster**: The 'identifiedTeams' object in your response MUST contain the full updated roster (all previously known entities plus any new ones found in this turn).`;

            // Inject known entities into user prompt for better consistency
            if (knownTeams.length > 0) {
                userPrompt += `\n\n### KNOWN TEAMS:\n${JSON.stringify(knownTeams, null, 2)}`;
            }
            if (knownPlayers.length > 0) {
                userPrompt += `\n\n### KNOWN PLAYERS:\n${JSON.stringify(knownPlayers, null, 2)}`;
            }

            // --- USE VIDEOMETADATA OFFSETS ---
            const videoFps = parseInt(process.env.ANALYSIS_FPS || '1', 10);
            
            // Ensure offsets are rounded integers and have the "s" suffix required by the API
            const roundedStart = Math.floor(startTime);
            const roundedEnd = Math.ceil(endTime || (startTime + 120));

            const currentTurn = {
                role: "user",
                parts: [
                    { 
                        fileData: { mimeType: 'video/mp4', fileUri: finalFileUri },
                        videoMetadata: {
                            startOffset: `${roundedStart}s`, 
                            endOffset: `${roundedEnd}s`,
                            fps: videoFps
                        }
                    } as any,
                    { text: userPrompt }
                ]
            };

            const contents = [...chatHistory, currentTurn];

            // 4. Generate Content
            const result = await this.genAI.models.generateContent({
                model: this.modelName,
                contents: contents,
                config: {
                    systemInstruction: systemInstructionText,
                    responseMimeType: "application/json",
                    responseSchema: EVENT_SCHEMA as any,
                },
            });


            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            const usageMetadata = result.usageMetadata ? {
                promptTokenCount: result.usageMetadata.promptTokenCount || 0,
                candidatesTokenCount: result.usageMetadata.candidatesTokenCount || 0,
                totalTokenCount: result.usageMetadata.totalTokenCount || 0
            } : undefined;

            if (!responseText) {
                return { events: [], rawResponse: '', updatedHistory: contents, usageMetadata };
            }

            const parsedResponse = JSON.parse(responseText.trim());
            
            // Append the model's response to the history for the next turn
            const updatedHistory = [
                ...contents,
                {
                    role: "model",
                    parts: [{ text: responseText }]
                }
            ];

            return {
                events: parsedResponse.events || [],
                rawResponse: responseText,
                updatedHistory: updatedHistory,
                usageMetadata,
                fileUri: finalFileUri,
                fileName: uploadedFileName || existingFileName
            };

        } catch (error: any) {
            this.logger?.error(`[GeminiProvider] Analysis failed: ${error.message}`, { error });
            throw error;
        }
    }

    public async deleteFile(fileName: string): Promise<void> {
        this.logger?.info(`[GeminiProvider] Deleting file ${fileName}`, { phase: 'cleanup' });
        await this.genAI.files.delete({ name: fileName }).catch((err: any) => 
            this.logger?.error(`[GeminiProvider] Failed to delete file ${fileName}`, { err })
        );
    }

    private async waitForFileActive(name: string): Promise<void> {
        const pollInterval = 10000; // 10 seconds
        const maxRetries = 60; // 10 minutes
        
        for (let i = 0; i < maxRetries; i++) {
            const file = await this.genAI.files.get({ name });
            if (file.state === 'ACTIVE') return;
            if (file.state === 'FAILED') throw new Error(`File ${name} failed processing.`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        throw new Error(`File ${name} did not become ACTIVE in time.`);
    }
}
