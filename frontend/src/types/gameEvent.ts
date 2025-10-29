export interface GameEvent {
    id: string;
    gameId: string;
    assignedTeamId: string | null;
    assignedPlayerId: string | null;
    identifiedTeamColor: string | null;
    identifiedJerseyNumber: number | null;
    eventType: string;
    eventDetails: any; // JSONB field
    absoluteTimestamp: number;
    videoClipStartTime: number;
    videoClipEndTime: number;
}