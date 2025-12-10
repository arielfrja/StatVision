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

export const FIRST_CHUNK_PROMPT = `You are analyzing the first chunk of a basketball game. Your primary goal is to identify all players and teams and assign them consistent IDs.

1.  **Identify Teams:** Identify the two teams. Assign one as 'HOME' and the other as 'AWAY' based on context if possible.
2.  **Assign Team IDs:** Populate the \`assignedTeamId\` using the format \`TEMP_TEAM_1\` for the first distinct team and \`TEMP_TEAM_2\` for the second.
3.  **Identify Players:** For each player, identify them by their jersey number.
4.  **Assign Player IDs:** Populate the \`assignedPlayerId\` using the format \`TEMP_PLAYER_<JERSEY_NUMBER>\`. For example, a player with jersey number 22 should have \`assignedPlayerId: "TEMP_PLAYER_22"\`.

It is critical that you use these exact same IDs for the same player or team in all events within this chunk.`;

export const SUBSEQUENT_CHUNK_PROMPT = `You are analyzing a subsequent chunk of a basketball game. You have been provided with lists of players and teams that have already been identified.

1.  **Match Existing Entities:** For each player or team in an event, you MUST check if they match an entity in the 'Known Teams' or 'Known Players' lists provided below.
2.  **Assign Existing IDs:** If a match is found, you MUST use the existing \`id\` from the list and populate the \`assignedPlayerId\` or \`assignedTeamId\` field with it.
3.  **Identify New Players/Teams:** If a player or team appears that is NOT in the known lists, you must identify them.
4.  **Assign New Temporary IDs:** For any new entity, create a new temporary ID.
    *   For new teams, use the format \`TEMP_TEAM_3\`, \`TEMP_TEAM_4\`, and so on.
    *   For new players, use the format \`TEMP_PLAYER_<JERSEY_NUMBER>\`.

Ensure you are populating \`assignedPlayerId\` and \`assignedTeamId\` for every event where a player or team is identifiable.`;

export const KNOWN_TEAMS_PROMPT_TEMPLATE = `
Known Teams from previous chunks: {{teams}}. Use this information to consistently identify teams and assign them as HOME or AWAY based on the established mapping.`;

export const KNOWN_PLAYERS_PROMPT_TEMPLATE = `
Known Players from previous chunks: {{players}}. Use this information to consistently identify players.`;
