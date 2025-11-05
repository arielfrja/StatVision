import { GameEvent } from "./gameEvent";
import { Team } from "./team";
import { GameTeamStats, GamePlayerStats } from "./stats";

export enum GameStatus {
    UPLOADED = "UPLOADED",
    PROCESSING = "PROCESSING",
    ANALYZED = "ANALYZED",
    ASSIGNMENT_PENDING = "ASSIGNMENT_PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

export interface Game {
    id: string;
    userId: string;
    status: GameStatus;
    // New Metadata Fields
    name: string;
    gameDate: Date | null;
    location: string | null;
    opponentName: string | null;
    quarterDuration: number | null;
    season: string | null;

    // Renamed Team Assignment Fields
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeTeam: Team | null;
    awayTeam: Team | null;

    // File Path
    videoUrl: string | null; // Renamed from filePath

    events: GameEvent[];

    teamStats: GameTeamStats[];
    playerStats: GamePlayerStats[];
    uploadedAt: Date;
}