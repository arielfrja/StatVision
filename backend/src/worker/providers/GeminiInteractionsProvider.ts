import { GoogleGenAI } from "@google/genai";
import { VideoChunk } from "../VideoChunkerService";
import { IdentifiedPlayer, IdentifiedTeam } from "../../core/interfaces/video-analysis.interfaces";
import { AnalysisProviderResponse, IVideoAnalysisProvider } from "../../core/interfaces/IVideoAnalysisProvider";
import { workerConfig } from "../../config/workerConfig";
import { chunkLogger as logger } from "../../config/loggers";
import { PromptLoader } from "../../shared/utils/PromptLoader";
import { EVENT_SCHEMA } from "../../constants/gemini";
import { GameType, IdentityMode } from "../../core/entities/Game";

/**
 * Implementation of the Gemini Interactions API (v1beta/interactions).
 * This provider uses the next-generation Gemini SDK pattern with built-in state management.
 */
export class GeminiInteractionsProvider implements IVideoAnalysisProvider {
    public readonly name = "gemini-interactions-v3";
    private genAI: GoogleGenAI;

    constructor(genAI: GoogleGenAI) {
        this.genAI = genAI;
    }

    public async analyzeChunk(
        chunkInfo: VideoChunk,
        identifiedPlayers: IdentifiedPlayer[],
        identifiedTeams: IdentifiedTeam[],
        visualContext?: string,
        gameType: GameType = GameType.FULL_COURT,
        identityMode: IdentityMode = IdentityMode.JERSEY_COLORS,
        chatHistory: any[] = []
    ): Promise<AnalysisProviderResponse> {
        const { chunkPath } = chunkInfo;
        logger.info(`[${this.name}] Starting Interactions API call for ${chunkPath}`, { 
            phase: 'analyzing',
            gameType,
            identityMode,
            historyLength: chatHistory.length
        });

        let uploadedFileName: string | null = null;

        try {
            const modelName = workerConfig.geminiModelName;
            
            // 1. Upload to Gemini File API
            const uploadResponse = await this.genAI.files.upload({
                file: chunkPath,
                config: { mimeType: 'video/mp4' }
            });
            uploadedFileName = uploadResponse.name!;

            // 2. Poll for ACTIVE state
            await this.waitForFileActive(uploadedFileName);
            const file = await this.genAI.files.get({ name: uploadedFileName });

            // 3. Build detailed multi-turn prompt context
            const formatInstructions = PromptLoader.getRulesetInstruction(gameType);
            const identityInstructions = PromptLoader.getRulesetInstruction(identityMode);

            const systemInstructionText = PromptLoader.loadPrompt('system_instruction', {
                visualContext: visualContext || 'No additional context provided.',
                formatInstructions,
                identityInstructions
            });

            const isFirstChunk = chatHistory.length === 0;
            let userPrompt = isFirstChunk 
                ? PromptLoader.loadPrompt('first_chunk') 
                : PromptLoader.loadPrompt('subsequent_chunk', { sequence: chunkInfo.sequence.toString() });

            // Context Injection for improved consistency
            if (identifiedTeams.length > 0) {
                userPrompt += `\n\n### KNOWN TEAMS (From previous context):\n${JSON.stringify(identifiedTeams, null, 2)}`;
            }
            if (identifiedPlayers.length > 0) {
                userPrompt += `\n\n### KNOWN PLAYERS (From previous context):\n${JSON.stringify(identifiedPlayers, null, 2)}`;
            }

            // 4. Execute the Interaction
            logger.info(`[${this.name}] Calling interactions.create for ${chunkPath}`, { phase: 'analyzing' });

            const interaction = await this.genAI.interactions.create({
                model: modelName,
                system_instruction: systemInstructionText,
                input: [
                    ...chatHistory, // Maintain the conversation state
                    {
                        role: "user",
                        parts: [
                            { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
                            { text: userPrompt }
                        ]
                    }
                ],
                responseMimeType: "application/json",
                responseSchema: EVENT_SCHEMA as any,
                thinkingLevel: "high", 
            } as any); // Use any here temporarily to bypass strict SDK type inconsistencies

            if (!interaction.outputs || interaction.outputs.length === 0) {
                throw new Error("Gemini API returned no outputs.");
            }

            const lastOutput = interaction.outputs[interaction.outputs.length - 1];
            let responseText = "";
            
            if ('text' in lastOutput && (lastOutput as any).text) {
                responseText = (lastOutput as any).text;
            } else if ('parts' in lastOutput && (lastOutput as any).parts) {
                responseText = ((lastOutput as any).parts as any[]).map((p: any) => p.text || "").join("");
            }

            if (!responseText) throw new Error("Gemini API returned an empty output.");

            const parsedResponse = JSON.parse(responseText.trim());
            const parsedEvents = parsedResponse.events || [];

            logger.info(`[${this.name}] Successfully parsed ${parsedEvents.length} events for ${chunkPath}.`, { phase: 'analyzing' });

            // Update history for the next chunk
            const updatedHistory = [
                ...chatHistory,
                { role: "user", parts: [{ text: userPrompt }] },
                { role: "model", parts: [{ text: responseText }] }
            ];

            return { 
                status: 'fulfilled', 
                events: parsedEvents.map((e: any) => ({ ...e, chunkMetadata: chunkInfo })), 
                rawResponse: responseText,
                updatedHistory
            };

        } catch (error: any) {
            logger.error(`[${this.name}] Error during analysis of ${chunkPath}`, { error: error.message });
            return { status: 'rejected', events: [], rawResponse: '', error: error };
        } finally {
            if (uploadedFileName) {
                await this.genAI.files.delete({ name: uploadedFileName }).catch(() => {});
            }
        }
    }

    private async waitForFileActive(name: string): Promise<void> {
        const pollInterval = workerConfig.geminiFilePollIntervalMs;
        const maxRetries = workerConfig.geminiFilePollMaxRetries;
        for (let i = 0; i < maxRetries; i++) {
            const file = await this.genAI.files.get({ name });
            if (file.state === 'ACTIVE') return;
            if (file.state === 'FAILED') throw new Error(`File ${name} failed processing.`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        throw new Error(`File ${name} did not become ACTIVE in time.`);
    }
}
