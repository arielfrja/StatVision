import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';
import logger from "../config/logger";
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
    private genAI: GoogleGenerativeAI;

    constructor(genAI: GoogleGenerativeAI) {
        this.genAI = genAI;
    }

    public async callGeminiApi(chunkInfo: VideoChunk, identifiedPlayers: IdentifiedPlayer[], identifiedTeams: IdentifiedTeam[]): Promise<GeminiApiResponse> {
        const { chunkPath } = chunkInfo;
        logger.info(`[GeminiAnalysisService] Starting API call for ${chunkPath}`);

        try {
            const schema: Schema = {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        eventType: { type: SchemaType.STRING },
                        timestamp: { type: SchemaType.STRING },
                        description: { type: SchemaType.STRING },
                        identifiedJerseyNumber: { type: SchemaType.STRING },
                        identifiedTeamColor: { type: SchemaType.STRING },
                        identifiedPlayerDescription: { type: SchemaType.STRING },
                        identifiedTeamDescription: { type: SchemaType.STRING },
                        assignedTeamType: { type: SchemaType.STRING, enum: ['HOME', 'AWAY'], format: "enum" },
                    },
                    required: ["eventType", "timestamp", "description"],
                },
            };

            const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
            logger.info(`[GeminiAnalysisService] Using Gemini model: ${modelName}`);

            const model = this.genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            logger.debug(`[GeminiAnalysisService] Reading and encoding file: ${chunkPath}`);
            const videoBase64 = fs.readFileSync(chunkPath).toString('base64');
            logger.info(`[GeminiAnalysisService] File encoded. Size: ${(videoBase64.length / 1024 / 1024).toFixed(2)} MB. Sending to API...`);

            let prompt = `You are an expert basketball analyst. Your task is to watch this video chunk, including its audio, and identify all significant gameplay events. For each event, provide its type, a brief description, and its timestamp relative to the start of this video chunk.\n\nUse audio cues to improve your analysis. A sharp whistle likely indicates a foul or a stoppage of play. The sound of the ball hitting the rim followed by cheers can help confirm if a shot was made. The sound of the ball bouncing can indicate possession.\n\nIdentify players and teams using the following guidelines:\n- If identifiable, provide the jersey number (identifiedJerseyNumber) and team color (identifiedTeamColor).\n- If jersey number or team color are not clear, provide a brief physical description of the player (identifiedPlayerDescription, e.g., "tall player with red shoes", "player with a headband").\n- If team color is not clear, provide a brief description of the team (identifiedTeamDescription, e.g., "team in dark shirts", "team in light shirts").\n- Crucially, assign each player to either the 'HOME' or 'AWAY' team (assignedTeamType). Define 'HOME' as the team that starts with possession or is generally more prominent, and 'AWAY' as the opposing team. Maintain this distinction consistently throughout the analysis.\n\nPrioritize jersey number and team color if available and clear. Ensure consistent descriptions for the same player/team across events within this video chunk.\n\n`;

            if (identifiedTeams.length > 0) {
                prompt += `
Known Teams from previous chunks: ${JSON.stringify(identifiedTeams)}. Try to match new observations to these teams.`;
            }
            if (identifiedPlayers.length > 0) {
                prompt += `
Known Players from previous chunks: ${JSON.stringify(identifiedPlayers)}. Try to match new observations to these players.`;
            }

            prompt += `

The 'eventType' field must be one of the following exact values: ${ALLOWED_EVENT_TYPES.join(", ")}. 

Respond with a JSON array conforming to the provided schema.`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: "video/mp4",
                        data: videoBase64,
                    },
                },
            ]);
            logger.info(`[GeminiAnalysisService] API call complete for ${chunkPath}. Processing response...`);

            const response = result.response;

            if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts || response.candidates[0].content.parts.length === 0) {
                logger.warn(`[GeminiAnalysisService] No valid candidates or content found in Gemini API response for ${chunkPath}.`);
                return { status: 'fulfilled', events: [] };
            }

            const text = response.candidates[0].content.parts[0].text;
            if (!text) {
                logger.warn(`[GeminiAnalysisService] Empty text response received for ${chunkPath}.`);
                return { status: 'fulfilled', events: [] };
            }
            const parsedEvents = JSON.parse(text);

            if (Array.isArray(parsedEvents)) {
                logger.info(`[GeminiAnalysisService] Successfully parsed ${parsedEvents.length} events from structured API response for ${chunkPath}.`);
                const eventsWithMetadata = parsedEvents.map(event => ({ ...event, chunkMetadata: chunkInfo }));
                return { status: 'fulfilled', events: eventsWithMetadata };
            } else {
                logger.warn(`[GeminiAnalysisService] Parsed structured response for ${chunkPath} was not a JSON array.`);
                return { status: 'fulfilled', events: [] };
            }

        } catch (error) {
            logger.error(`[GeminiAnalysisService] Error during API call for ${chunkPath}:`, error);
            return { status: 'rejected', chunkInfo, error };
        }
    }
}
