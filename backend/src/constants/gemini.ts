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
    description: "A list of basketball gameplay events identified from video analysis.",
    properties: {
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
                        description: "Specific detail about the event (e.g., 'Layup', 'Jump Shot', 'Cross-over').",
                        nullable: true 
                    },
                    timestamp: { 
                        type: "string", 
                        description: "The time of the event relative to the start of THIS chunk (MM:SS format)." 
                    },
                    isSuccessful: { 
                        type: "boolean", 
                        description: "Whether the action (shot, pass, etc.) was successful.",
                        nullable: true 
                    },
                    period: { 
                        type: "number", 
                        description: "The current game period (1-4, or overtime).",
                        nullable: true 
                    },
                    timeRemaining: { 
                        type: "string", 
                        description: "The clock time remaining in the period as seen on the scoreboard.",
                        nullable: true 
                    },
                    xCoord: { 
                        type: "number", 
                        description: "Normalized X coordinate of the action (0-100).",
                        nullable: true 
                    },
                    yCoord: { 
                        type: "number", 
                        description: "Normalized Y coordinate of the action (0-100).",
                        nullable: true 
                    },
                    assignedPlayerId: { 
                        type: "string", 
                        description: "The ID of the player primarily responsible for the event.",
                        nullable: true 
                    },
                    assignedTeamId: { 
                        type: "string", 
                        description: "The ID of the team performing the action.",
                        nullable: true 
                    },
                    relatedEventId: { 
                        type: "string", 
                        description: "The ID of a linked event (e.g., an Assist linked to a Shot).",
                        nullable: true 
                    },
                    onCourtPlayerIds: { 
                        type: "array", 
                        description: "IDs of players visible on the court during this event.",
                        items: { type: "string" }, 
                        nullable: true 
                    },
                    identifiedTeamColor: { 
                        type: "string", 
                        description: "The dominant jersey color of the acting team.",
                        nullable: true 
                    },
                    identifiedJerseyNumber: { 
                        type: "number", 
                        description: "The jersey number of the acting player.",
                        nullable: true 
                    },
                    identifiedPlayerDescription: { 
                        type: "string", 
                        description: "Physical description of the player if ID is unknown.",
                        nullable: true 
                    },
                    identifiedTeamDescription: { 
                        type: "string", 
                        description: "Description of the team (e.g., 'Team in Red/White').",
                        nullable: true 
                    },
                    assignedTeamType: { 
                        type: "string", 
                        description: "Role of the team in the game context.",
                        enum: ["HOME", "AWAY"], 
                        nullable: true 
                    }
                },
                required: ["eventType", "timestamp"]
            }
        }
    },
    required: ["events"]
};

