import { ALLOWED_EVENT_TYPES } from "./eventTypes";
import { SportType } from "../core/entities/SportType";

/**
 * Gemini API Configuration for StatVision
 */

const BASE_EVENT_PROPERTIES = {
    eventType: {
        type: "string",
        description: "The category of the action.",
    },
    eventSubType: { 
        type: "string", 
        description: "Specific detail about the event.",
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
        description: "The current game period.",
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
        description: "The ID of a linked event.",
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
        description: "Description of the team.",
        nullable: true 
    },
    assignedTeamType: { 
        type: "string", 
        description: "Role of the team in the game context.",
        enum: ["HOME", "AWAY"], 
        nullable: true 
    }
};

export const BASKETBALL_SCHEMA = {
    type: "object",
    description: "A list of basketball gameplay events identified from video analysis.",
    properties: {
        events: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    ...BASE_EVENT_PROPERTIES,
                    eventType: {
                        ...BASE_EVENT_PROPERTIES.eventType,
                        enum: ALLOWED_EVENT_TYPES,
                    }
                },
                required: ["eventType", "timestamp"]
            }
        }
    },
    required: ["events"]
};

export const SOCCER_SCHEMA = {
    type: "object",
    description: "A list of soccer gameplay events identified from video analysis.",
    properties: {
        events: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    ...BASE_EVENT_PROPERTIES,
                    eventType: {
                        ...BASE_EVENT_PROPERTIES.eventType,
                        enum: ["GOAL", "SHOT", "PASS", "FOUL", "CORNER_KICK", "PENALTY", "YELLOW_CARD", "RED_CARD", "SUBSTITUTION", "OFFSIDE"],
                    }
                },
                required: ["eventType", "timestamp"]
            }
        }
    },
    required: ["events"]
};

export const VOLLEYBALL_SCHEMA = {
    type: "object",
    description: "A list of volleyball gameplay events identified from video analysis.",
    properties: {
        events: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    ...BASE_EVENT_PROPERTIES,
                    eventType: {
                        ...BASE_EVENT_PROPERTIES.eventType,
                        enum: ["SERVE", "SET", "SPIKE", "BLOCK", "DIG", "POINT", "FOUL", "SUBSTITUTION"],
                    }
                },
                required: ["eventType", "timestamp"]
            }
        }
    },
    required: ["events"]
};

export const SPORT_SCHEMAS: Record<SportType, any> = {
    [SportType.BASKETBALL]: BASKETBALL_SCHEMA,
    [SportType.SOCCER]: SOCCER_SCHEMA,
    [SportType.VOLLEYBALL]: VOLLEYBALL_SCHEMA,
    [SportType.TENNIS]: BASKETBALL_SCHEMA, // Placeholder
};

export const EVENT_SCHEMA = BASKETBALL_SCHEMA; // Default for backward compatibility


