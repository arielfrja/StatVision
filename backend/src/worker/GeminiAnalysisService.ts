import { GoogleGenAI, Part } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { workerConfig } from "../config/workerConfig";
import { chunkLogger as logger } from "../config/loggers";
import { VideoChunk } from "./VideoChunkerService";
import { IdentifiedPlayer, IdentifiedTeam } from "../interfaces/video-analysis.interfaces";

// This should be managed via a shared constants file or similar
const ALLOWED_EVENT_TYPES = [
    'Game Start', 'Period Start', 'Jump Ball', 'Jump Ball Possession', 'Possession Change',
    'Shot Attempt', 'Shot Made', 'Shot Missed', '3PT Shot Attempt', '3PT Shot Made', '3PT Shot Missed',
    'Free Throw Attempt', 'Free Throw Made', 'Free Throw Missed',
    'Offensive Rebound', 'Defensive Rebound', 'Team Rebound',
    'Assist', 'Steal', 'Block', 'Turnover',
    'Personal Foul', 'Shooting Foul', 'Offensive Foul', 'Technical Foul', 'Flagrant Foul',
    'Violation', 'Out of Bounds', 'Substitution', 'Timeout Taken',
    'End of Period', 'End of Game'
];

export type GeminiApiResponse = { status: 'fulfilled'; events: any[] } | { status: 'rejected'; chunkInfo: VideoChunk; error: any };

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

            let prompt = `You are an expert basketball analyst. Your task is to watch this video chunk, including its audio, and identify all significant gameplay events. For each event, provide its type, a brief description, and its timestamp relative to the start of this video chunk.\n\nUse audio cues to improve your analysis. A sharp whistle likely indicates a foul or a stoppage of play. The sound of the ball hitting the rim followed by cheers can help confirm if a shot was made. The sound of the ball bouncing can indicate possession.\n\n`;

            const isFirstChunk = identifiedTeams.length === 0 && identifiedPlayers.length === 0;

            if (isFirstChunk) {
                prompt += `Identify the two teams in this clip by their jersey colors and any other distinguishing features. Assign one team as 'TEAM_A' and the other as 'TEAM_B'. For players, identify them by jersey number if clear, otherwise by a brief physical description. Ensure consistent identification of teams and players throughout this chunk.`;
            } else {
                prompt += `Identify players and teams using the following guidelines:\n- If identifiable, provide the jersey number (identifiedJerseyNumber) and team color (identifiedTeamColor).\n- If jersey number or team color are not clear, provide a brief physical description of the player (identifiedPlayerDescription, e.g., "tall player with red shoes", "player with a headband").\n- If team color is not clear, provide a brief description of the team (identifiedTeamDescription, e.g., "team in dark shirts", "team in light shirts").\n- Crucially, assign each player to either the 'HOME' or 'AWAY' team (assignedTeamType). Maintain this distinction consistently throughout the analysis.\n\nPrioritize jersey number and team color if available and clear. Ensure consistent descriptions for the same player/team across events within this video chunk.\n\n`;
            }

            if (identifiedTeams.length > 0) {
                prompt += `
Known Teams from previous chunks: ${JSON.stringify(identifiedTeams)}. Use this information to consistently identify teams and assign them as HOME or AWAY based on the established mapping.`;
            }
            if (identifiedPlayers.length > 0) {
                prompt += `
Known Players from previous chunks: ${JSON.stringify(identifiedPlayers)}. Use this information to consistently identify players.`;
            }

            prompt += `

The 'eventType' field must be one of the following exact values: ${ALLOWED_EVENT_TYPES.join(", ")}. 

Respond with a JSON array.`;

            const parts: Part[] = [
                {
                    fileData: {
                        mimeType: file.mimeType,
                        fileUri: file.uri,
                    },
                },
                { text: prompt }
            ];

            const result = await this.genAI.models.generateContent({ model: modelName, contents: [{ role: "user", parts }] });
            logger.info(`[GeminiAnalysisService] API call complete for ${chunkPath}. Processing response...`, { phase: 'analyzing' });

            const response = result;

            if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
                logger.warn(`[GeminiAnalysisService] No valid candidates or content found in Gemini API response for ${chunkPath}.`, { phase: 'analyzing' });
                return { status: 'fulfilled', events: [] };
            }

            const text = response.candidates[0].content.parts[0].text;
            if (!text) {
                logger.warn(`[GeminiAnalysisService] Empty text response received for ${chunkPath}.`, { phase: 'analyzing' });
                return { status: 'fulfilled', events: [] };
            }

            logger.debug(`[GeminiAnalysisService] Raw Gemini response for ${chunkPath}:`, { rawResponse: text, phase: 'analyzing' });

            // Clean the response to remove markdown formatting
            const cleanedText = text.replace(/^```json\s*|```$/g, '').trim();

            const parsedEvents = JSON.parse(cleanedText);

            if (Array.isArray(parsedEvents)) {
                logger.info(`[GeminiAnalysisService] Successfully parsed ${parsedEvents.length} events from structured API response for ${chunkPath}.`, { phase: 'analyzing' });
                const eventsWithMetadata = parsedEvents.map(event => ({ ...event, chunkMetadata: chunkInfo }));
                return { status: 'fulfilled', events: eventsWithMetadata };
            } else {
                logger.warn(`[GeminiAnalysisService] Parsed structured response for ${chunkPath} was not a JSON array.`, { phase: 'analyzing' });
                return { status: 'fulfilled', events: [] };
            }

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
