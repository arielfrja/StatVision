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
    ANALYSIS_FAILED_RETRYABLE = "ANALYSIS_FAILED_RETRYABLE",
}

export enum GameType {
    FULL_COURT = 'FULL_COURT',
    THREE_X_THREE = 'THREE_X_THREE',
    STREET_BALL = 'STREET_BALL',
    ONE_X_ONE = 'ONE_X_ONE'
}

export enum IdentityMode {
    JERSEY_COLORS = 'JERSEY_COLORS',
    INTERACTION_BASED = 'INTERACTION_BASED'
}

export interface Game {
    id: string;
    userId: string;
    status: GameStatus;
    gameType: GameType;
    identityMode: IdentityMode;
    ruleset: {
        pointValue?: '1_AND_2' | '2_AND_3';
        halfCourt?: boolean;
        duration?: number;
    } | null;
    // New Metadata Fields
    name: string;
    gameDate: Date | null;
    location: string | null;
    opponentName: string | null;
    quarterDuration: number | null;
    season: string | null;
    failureReason?: string | null;

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