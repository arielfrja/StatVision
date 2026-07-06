export interface IdentifiedTeam {
    id: string; // Internal temporary ID (e.g. 'TEMP_TEAM_1') OR v5 UUID after resolution
    name?: string | null;
    type: 'HOME' | 'AWAY';
    color: string | null;
    description: string | null;
}

export interface IdentifiedPlayer {
    id:string; // Internal temporary ID (e.g. 'TEMP_PLAYER_5') OR v5 UUID after resolution
    teamId: string | null; // Foreign key to IdentifiedTeam (raw or UUID)
    name?: string | null;
    jerseyNumber: number | null;
    description: string | null; // e.g., "tall player with red shoes"
    position?: string | null;
    teamAssignmentConfidence?: number; // 0-1 score based on interaction frequency
}

// Note: This is a refined version of the existing GameEvent entity for use within the job.
// It may not match the final database schema exactly but provides type safety for the worker.
export interface ProcessedGameEvent {
    id: string; // UUID v4
    gameId: string;
    eventType: string; // Should be an enum, matching ALLOWED_EVENT_TYPES
    eventSubType: string | null;
    isSuccessful: boolean;
    period: number | null;
    timeRemaining: number | null;
    xCoord: number | null;
    yCoord: number | null;
    absoluteTimestamp: number; // The most critical field
    assignedPlayerId: string | null;
    assignedTeamId: string | null;
    relatedEventId?: string | null; // e.g., link an assist to a made shot
    onCourtPlayerIds: string[] | null;
    identifiedTeamColor: string | null;
    identifiedJerseyNumber: number | null;
    videoClipStartTime: number;
    videoClipEndTime: number;
}
