import { GoogleGenAI, Part } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { workerConfig } from "../config/workerConfig";
import { chunkLogger as logger } from "../config/loggers";
import { VideoChunk } from "./VideoChunkerService";
import { IdentifiedPlayer, IdentifiedTeam } from "../interfaces/video-analysis.interfaces";
import { ALLOWED_EVENT_TYPES } from "../constants/eventTypes"; // Added this import
import {
    EVENT_SCHEMA,
    BASE_PROMPT,
    FIRST_CHUNK_PROMPT,
    SUBSEQUENT_CHUNK_PROMPT,
    KNOWN_TEAMS_PROMPT_TEMPLATE,
    KNOWN_PLAYERS_PROMPT_TEMPLATE
} from "../constants/gemini";



export type GeminiApiResponse = { status: 'fulfilled'; events: any[]; rawResponse: string; } | { status: 'rejected'; chunkInfo: VideoChunk; error: any };

export class GeminiAnalysisService {
    private genAI: GoogleGenAI;

    constructor(genAI: GoogleGenAI) {
        this.genAI = genAI;
    }

    public async callGeminiApi(chunkInfo: VideoChunk, identifiedPlayers: IdentifiedPlayer[], identifiedTeams: IdentifiedTeam[]): Promise<GeminiApiResponse> {
        const { chunkPath } = chunkInfo;
        logger.info(`[GeminiAnalysisService] Starting API call for ${chunkPath}`, { phase: 'analyzing' });

        let uploadedFileName: string | null = null;

        try {
            const modelName = workerConfig.geminiModelName;
            logger.info(`[GeminiAnalysisService] Using Gemini model: ${modelName}`, { phase: 'analyzing' });

            logger.info(`[GeminiAnalysisService] Uploading file to Gemini File API: ${chunkPath}`, { phase: 'analyzing' });
            const uploadResponse = await this.genAI.files.upload({
                file: chunkPath,
                config: {
                    mimeType: 'video/mp4',
                }
            });

            if (!uploadResponse.name) {
                throw new Error("File upload failed: No name returned for uploaded file.");
            }
            uploadedFileName = uploadResponse.name;
            logger.info(`[GeminiAnalysisService] File upload initiated. Name: ${uploadedFileName}. Waiting for it to become ACTIVE.`, { phase: 'analyzing' });

            // Poll for active state
            let file = await this.genAI.files.get({ name: uploadedFileName });
            const pollInterval = workerConfig.geminiFilePollIntervalMs;
            const maxRetries = workerConfig.geminiFilePollMaxRetries;
            let retryCount = 0;

            while (file.state === 'PROCESSING' && retryCount < maxRetries) {
                logger.debug(`[GeminiAnalysisService] File ${file.name} is still PROCESSING. Waiting ${pollInterval / 1000}s...`, { phase: 'analyzing' });
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                file = await this.genAI.files.get({ name: uploadedFileName });
                retryCount++;
            }

            if (file.state !== 'ACTIVE') {
                throw new Error(`File ${file.name} did not become ACTIVE after ${maxRetries * pollInterval / 1000}s. Current state: ${file.state}`);
            }
            
            logger.info(`[GeminiAnalysisService] File is now ACTIVE. URI: ${file.uri}, Name: ${file.name}`, { phase: 'analyzing' });

            let prompt = BASE_PROMPT;

            const isFirstChunk = identifiedTeams.length === 0 && identifiedPlayers.length === 0;

            if (isFirstChunk) {
                prompt += FIRST_CHUNK_PROMPT;
            } else {
                prompt += SUBSEQUENT_CHUNK_PROMPT;
            }

            if (identifiedTeams.length > 0) {
                prompt += KNOWN_TEAMS_PROMPT_TEMPLATE.replace('{{teams}}', JSON.stringify(identifiedTeams));
            }
            if (identifiedPlayers.length > 0) {
                prompt += KNOWN_PLAYERS_PROMPT_TEMPLATE.replace('{{players}}', JSON.stringify(identifiedPlayers));
            }

            const parts: Part[] = [
                {
                    fileData: {
                        mimeType: file.mimeType,
                        fileUri: file.uri,
                    },
                },
                { text: prompt }
            ];

            const result = await this.genAI.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts }],
                config: { // Correct way to pass structured output config
                    responseMimeType: "application/json",
                    responseSchema: EVENT_SCHEMA,
                },
            });
            logger.info(`[GeminiAnalysisService] API call complete for ${chunkPath}. Processing response...`, { phase: 'analyzing' });

            const response = result;

            if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
                logger.warn(`[GeminiAnalysisService] No valid candidates or content found in Gemini API response for ${chunkPath}.`, { phase: 'analyzing' });
                return { status: 'fulfilled', events: [], rawResponse: '' };
            }

            // Parse response from text()
            const responseText = response.candidates[0].content.parts[0].text;
            if (!responseText) {
                logger.warn(`[GeminiAnalysisService] Empty text response received for ${chunkPath}.`, { phase: 'analyzing' });
                return { status: 'fulfilled', events: [], rawResponse: '' };
            }

            logger.debug(`[GeminiAnalysisService] Raw Gemini response for ${chunkPath}:`, { rawResponse: responseText, phase: 'analyzing' });

            // The response should already be clean JSON if schema is used, but keep trim for safety
            const cleanedText = responseText.trim(); 

            const parsedResponse = JSON.parse(cleanedText);
            const parsedEvents = parsedResponse.events;
            logger.info(`[GeminiAnalysisService] Successfully parsed ${parsedEvents.length} events from structured API response for ${chunkPath}.`, { phase: 'analyzing' });
            const eventsWithMetadata = parsedEvents.map((event: any) => ({ ...event, chunkMetadata: chunkInfo }));
            return { status: 'fulfilled', events: eventsWithMetadata, rawResponse: cleanedText };

        } catch (error: any) {
            const errorMessage = error.message || 'An unknown error occurred during Gemini API call.';
            const errorStack = error.stack || 'No stack trace available.';
            logger.error(`[GeminiAnalysisService] Error during API call for ${chunkPath}.`, {
                error: {
                    message: errorMessage,
                    stack: errorStack,
                    chunkPath: chunkPath,
                    chunkSequence: chunkInfo.sequence,
                },
                phase: 'analyzing'
            });
            return { status: 'rejected', chunkInfo, error };
        } finally {
            if (uploadedFileName) {
                try {
                    logger.info(`[GeminiAnalysisService] Deleting uploaded file: ${uploadedFileName}`, { phase: 'analyzing' });
                    await this.genAI.files.delete({ name: uploadedFileName });
                    logger.info(`[GeminiAnalysisService] Successfully deleted file: ${uploadedFileName}`, { phase: 'analyzing' });
                } catch (deleteError: any) {
                    const errorMessage = deleteError.message || 'An unknown error occurred during file deletion.';
                    const errorStack = deleteError.stack || 'No stack trace available.';
                    logger.error(`[GeminiAnalysisService] Failed to delete uploaded file ${uploadedFileName}.`, {
                        error: {
                            message: errorMessage,
                            stack: errorStack,
                            fileName: uploadedFileName,
                        },
                        phase: 'analyzing'
                    });
                }
            }
        }
    }
}
