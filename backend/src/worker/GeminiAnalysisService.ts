import { GoogleGenAI, Part, Type, FunctionCallingConfigMode } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { workerConfig } from "../config/workerConfig";
import { chunkLogger as logger } from "../config/loggers";
import { VideoChunk } from "./VideoChunkerService";
import { IdentifiedPlayer, IdentifiedTeam } from "../interfaces/video-analysis.interfaces";

const GameAnalysisTool = {
    name: 'record_game_events',
    description: 'Records all identified basketball game events from the video chunk.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            events: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        eventType: { type: Type.STRING, description: 'Type of the gameplay event from the allowed list.' },
                        timestamp: { type: Type.STRING, description: 'Timestamp of the event in MM:SS format relative to this video chunk.' },
                        description: { type: Type.STRING, description: 'A brief text description of what occurred.' },
                        isSuccessful: { type: Type.BOOLEAN, description: 'For events like shots, indicates if it was successful.' },
                        identifiedJerseyNumber: { type: Type.STRING, description: 'Jersey number of the key player in the event.' },
                        identifiedTeamColor: { type: Type.STRING, description: 'Jersey color of the team involved.' },
                        assignedTeamType: { type: Type.STRING, enum: ['HOME', 'AWAY'], description: "The player's assigned team type." }
                    },
                    required: ['eventType', 'timestamp', 'description']
                }
            }
        },
        required: ['events']
    }
};

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

export type GeminiApiResponse = { status: 'fulfilled'; events: any[], thoughtSignature?: string, rawApiResponse?: any } | { status: 'rejected'; chunkInfo: VideoChunk; error: any };

export class GeminiAnalysisService {
    private genAI: GoogleGenAI;

    constructor(genAI: GoogleGenAI) {
        this.genAI = genAI;
    }

    public async callGeminiApi(chunkInfo: VideoChunk, identifiedPlayers: IdentifiedPlayer[], identifiedTeams: IdentifiedTeam[], previousSignature?: string | null): Promise<GeminiApiResponse> {
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

Follow the output schema precisely. Here is an example of a perfect event object:
{
  "eventType": "Shot Attempt",
  "timestamp": "00:45",
  "description": "Player in white jersey #23 attempts a 3-point shot from the top of the key.",
  "isSuccessful": false,
  "identifiedJerseyNumber": "23",
  "identifiedTeamColor": "white",
  "assignedTeamType": "HOME"
}

Analyze the video and provide all events by calling the 'record_game_events' tool. Your final response MUST be a call to the 'record_game_events' tool, containing an array of all identified events. DO NOT include any other text or markdown outside of this tool call.`;

            const parts: Part[] = [
                {
                    fileData: {
                        mimeType: file.mimeType,
                        fileUri: file.uri,
                    },
                },
                { text: prompt }
            ];

            const generateContentConfig: any = {
                tools: [{ functionDeclarations: [GameAnalysisTool] }],
                toolConfig: {
                    functionCallingConfig: {
                        // Force the model to call our function
                        mode: FunctionCallingConfigMode.ANY,
                    }
                }
            };

            if (previousSignature) {
                generateContentConfig.thoughtSignature = previousSignature;
            }

            const result = await this.genAI.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts }],
                config: generateContentConfig
            });
            logger.info(`[GeminiAnalysisService] API call complete for ${chunkPath}. Processing response...`, { phase: 'analyzing' });
            logger.debug(`[GeminiAnalysisService] Raw Gemini API response for ${chunkPath}:`, { fullResponse: result });

            const call = result.candidates?.[0]?.content?.parts?.[0]?.functionCall;
            const thoughtSignature = result.candidates?.[0]?.content?.parts?.[0]?.thoughtSignature;

            if (call?.name === 'record_game_events' && call.args?.events) {
                const parsedEvents = call.args.events as any[]; // This is already a valid JS array
                logger.info(`Successfully parsed ${parsedEvents.length} events from structured response.`);
                const eventsWithMetadata = parsedEvents.map(event => ({ ...event, chunkMetadata: chunkInfo }));
                return { status: 'fulfilled', events: eventsWithMetadata, thoughtSignature, rawApiResponse: result };
            } else {
                logger.warn(`Response did not contain the expected function call. Full Gemini API response:`, { fullResponse: result });
                return { status: 'fulfilled', events: [], rawApiResponse: result };
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
