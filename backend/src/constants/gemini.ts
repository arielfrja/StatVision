import { ALLOWED_EVENT_TYPES } from "./eventTypes";

export const EVENT_SCHEMA = {
    type: "object",
    properties: {
        events: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    eventType: {
                        type: "string",
                        enum: ALLOWED_EVENT_TYPES,
                    },
                    eventSubType: { type: "string", nullable: true },
                    timestamp: { type: "string" },
                    isSuccessful: { type: "boolean", nullable: true },
                    period: { type: "number", nullable: true },
                    timeRemaining: { type: "string", nullable: true },
                    xCoord: { type: "number", nullable: true },
                    yCoord: { type: "number", nullable: true },
                    assignedPlayerId: { type: "string", nullable: true },
                    assignedTeamId: { type: "string", nullable: true },
                    relatedEventId: { type: "string", nullable: true },
                    onCourtPlayerIds: { type: "array", items: { type: "string" }, nullable: true },
                    identifiedTeamColor: { type: "string", nullable: true },
                    identifiedJerseyNumber: { type: "number", nullable: true },
                    identifiedPlayerDescription: { type: "string", nullable: true },
                    identifiedTeamDescription: { type: "string", nullable: true },
                    assignedTeamType: { type: "string", enum: ["HOME", "AWAY"], nullable: true }
                },
                required: ["eventType", "timestamp"]
            }
        }
    },
    required: ["events"]
};

export const BASE_PROMPT = `You are an expert basketball analyst. Your task is to watch this video chunk, including its audio, and identify all significant gameplay events. For each event, provide its type, a brief description, and its timestamp relative to the start of this video chunk.

Use audio cues to improve your analysis. A sharp whistle likely indicates a foul or a stoppage of play. The sound of the ball hitting the rim followed by cheers can help confirm if a shot was made. The sound of the ball bouncing can indicate possession.

`;

export const FIRST_CHUNK_PROMPT = `Identify the two teams in this clip by their jersey colors and any other distinguishing features. Assign one team as 'TEAM_A' and the other as 'TEAM_B'. For players, identify them by jersey number if clear, otherwise by a brief physical description. Ensure consistent identification of teams and players throughout this chunk.`;

export const SUBSEQUENT_CHUNK_PROMPT = `Identify players and teams using the following guidelines:
- If identifiable, provide the jersey number (identifiedJerseyNumber) and team color (identifiedTeamColor).
- If jersey number or team color are not clear, provide a brief physical description of the player (identifiedPlayerDescription, e.g., "tall player with red shoes", "player with a headband").
- If team color is not clear, provide a brief description of the team (identifiedTeamDescription, e.g., "team in dark shirts", "team in light shirts").
- Crucially, assign each player to either the 'HOME' or 'AWAY' team (assignedTeamType). Maintain this distinction consistently throughout the analysis.

Prioritize jersey number and team color if available and clear. Ensure consistent descriptions for the same player/team across events within this video chunk.

`;

export const KNOWN_TEAMS_PROMPT_TEMPLATE = `
Known Teams from previous chunks: {{teams}}. Use this information to consistently identify teams and assign them as HOME or AWAY based on the established mapping.`;

export const KNOWN_PLAYERS_PROMPT_TEMPLATE = `
Known Players from previous chunks: {{players}}. Use this information to consistently identify players.`;
