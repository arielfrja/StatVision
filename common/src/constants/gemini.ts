import { ALLOWED_EVENT_TYPES } from "./eventTypes";

/**
 * Gemini API Configuration for StatVision
 * Using best practices from official Gemini documentation:
 * - Structured Output for type-safe event extraction.
 * - Contextual prompt engineering to minimize "blind" analysis.
 * - Temporal anchoring to ensure cross-chunk consistency.
 */

export const EVENT_SCHEMA = {
    type: "object",
    description: "A list of basketball gameplay events and identified entities (teams/players) from video analysis.",
    properties: {
        identifiedTeams: {
            type: "array",
            description: "A master list of all teams identified in the video so far.",
            items: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Internal temporary ID (e.g., 'TEMP_TEAM_1')." },
                    name: { 
                        type: "string", 
                        description: "Team name if visible. If unknown, use placeholder format like '<Team 1>'.", 
                        nullable: true 
                    },
                    color: { type: "string", description: "Dominant jersey color." },
                    type: { type: "string", enum: ["HOME", "AWAY"], description: "Assignment as home or away team." },
                    description: { type: "string", description: "Physical description of the team's appearance.", nullable: true },
                    players: {
                        type: "array",
                        description: "The roster of identified players for this team.",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "string", description: "Internal temporary ID (e.g., 'TEMP_PLAYER_5')." },
                                number: { type: "number", description: "Jersey number." },
                                name: { 
                                    type: "string", 
                                    description: "Player name if known. If unknown, use format '<Player #XX>'. NEVER include physical descriptions here; use the 'description' field for those.", 
                                    nullable: true 
                                },
                                description: { type: "string", description: "Brief physical description (e.g., 'Tall with headband').", nullable: true },
                                position: { type: "string", description: "Estimated court position.", nullable: true }
                            },
                            required: ["id", "number"]
                        }
                    }
                },
                required: ["id", "color", "type", "players"]
            }
        },
        events: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    eventType: {
                        type: "string",
                        description: "The category of the basketball action.",
                        enum: ALLOWED_EVENT_TYPES,
                    },
                    eventSubType: { 
                        type: "string", 
                        description: "Specific detail about the event (e.g., 'Layup', 'Jump Shot').",
                        nullable: true 
                    },
                    timestamp: { 
                        type: "string", 
                        description: "The time of the event relative to the start of THIS chunk (MM:SS format)." 
                    },
                    isSuccessful: { 
                        type: "boolean", 
                        description: "Whether the action was successful.",
                        nullable: true 
                    },
                    period: { 
                        type: "number", 
                        description: "The current game period (1-4).",
                        nullable: true 
                    },
                    xCoord: { 
                        type: "number", 
                        description: "Normalized X coordinate (0-100).",
                        nullable: true 
                    },
                    yCoord: { 
                        type: "number", 
                        description: "Normalized Y coordinate (0-100).",
                        nullable: true 
                    },
                    assignedPlayerId: { 
                        type: "string", 
                        description: "The ID of the player from the 'identifiedTeams' list above.",
                        nullable: true 
                    },
                    assignedTeamId: { 
                        type: "string", 
                        description: "The ID of the team from the 'identifiedTeams' list above.",
                        nullable: true 
                    }
                },
                required: ["eventType", "timestamp"]
            }
        }
    },
    required: ["events", "identifiedTeams"]
};
