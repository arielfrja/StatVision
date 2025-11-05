export interface IdentifiedTeam {
    id: string; // The v5 UUID
    type: 'HOME' | 'AWAY';
    color: string | null;
    description: string | null;
}

export interface IdentifiedPlayer {
    id:string; // The v5 UUID
    teamId: string; // Foreign key to IdentifiedTeam
    jerseyNumber: string | null;
    description: string | null; // e.g., "tall player with red shoes"
}

// Note: This is a refined version of the existing GameEvent entity for use within the job.
// It may not match the final database schema exactly but provides type safety for the worker.
export interface ProcessedGameEvent {
    id: string; // UUID v4
    gameId: string;
    eventType: string; // Should be an enum, matching ALLOWED_EVENT_TYPES
    absoluteTimestamp: number; // The most critical field
    assignedPlayerId: string | null;
    assignedTeamId: string | null;
    isSuccessful?: boolean;
    relatedEventId?: string | null; // e.g., link an assist to a made shot
    videoClipStartTime: number;
    videoClipEndTime: number;
}
