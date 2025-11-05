import { Player } from "./player";
import { Team } from "./team";

export interface GameEvent {
    id: string;
    gameId: string;
    assignedTeamId: string | null;
    assignedTeam: Team | null;
    assignedPlayerId: string | null;
    assignedPlayer: Player | null;
    identifiedTeamColor: string | null;
    identifiedJerseyNumber: number | null;
    eventType: string;
    eventSubType: string | null;
    isSuccessful: boolean;
    period: number | null;
    timeRemaining: number | null;
    xCoord: number | null;
    yCoord: number | null;
    relatedEventId: string | null;
    onCourtPlayerIds: string[] | null;
    eventDetails: any;
    absoluteTimestamp: number;
    videoClipStartTime: number | null;
    videoClipEndTime: number | null;
}