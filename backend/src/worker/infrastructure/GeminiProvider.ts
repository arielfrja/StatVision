import { GoogleGenAI, Part } from "@google/genai";
import * as fs from 'fs';
import { workerConfig } from "../../config/workerConfig";
import { chunkLogger as logger } from "../../config/loggers";
import { IdentifiedPlayer, IdentifiedTeam } from "../../core/interfaces/video-analysis.interfaces";
import { IVideoIntelligenceProvider, VideoChunkInfo, AnalysisResult } from "../../core/interfaces/IVideoIntelligenceProvider";
import { GameType, IdentityMode } from "../../core/entities/Game";
import { PromptLoader } from "../../shared/utils/PromptLoader";
import { EVENT_SCHEMA } from "../../constants/gemini";

export class GeminiProvider implements IVideoIntelligenceProvider {
    private genAI: GoogleGenAI;

    constructor(apiKey: string) {
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
        const { chunkPath } = chunk;
        logger.info(`[GeminiProvider] Starting chat-mode analysis for ${chunkPath}`, { 
            phase: 'analyzing', 
            gameType, 
            identityMode,
            historyTurns: chatHistory.length 
        });

        let uploadedFileName: string | null = null;

        try {
            const modelName = workerConfig.geminiModelName;
            
            // 1. Upload File
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

            // 3. Build Multi-turn Conversation using PromptLoader
            const formatInstructions = PromptLoader.getRulesetInstruction(gameType);
            const identityInstructions = PromptLoader.getRulesetInstruction(identityMode);

            const systemInstruction = PromptLoader.loadPrompt('system_instruction', {
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

            const currentTurn = {
                role: "user",
                parts: [
                    { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
                    { text: userPrompt }
                ]
            };

            const contents = [...chatHistory, currentTurn];

            // 4. Generate Content (systemInstruction passed via prompt concatenation)
            const combinedPrompt = `System Instructions:\n${systemInstruction}\n\nUser Request:\n${userPrompt}`;
            currentTurn.parts[1].text = combinedPrompt;

            const result = await this.genAI.models.generateContent({
                model: modelName,
                contents: contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: EVENT_SCHEMA as any,
                },
            });

            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) {
                return { events: [], rawResponse: '', updatedHistory: contents };
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
                updatedHistory: updatedHistory
            };

        } finally {
            if (uploadedFileName) {
                await this.genAI.files.delete({ name: uploadedFileName }).catch(err => 
                    logger.error(`[GeminiProvider] Failed to delete file ${uploadedFileName}`, { err })
                );
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
