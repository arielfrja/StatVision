import { Team } from "./team";

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
    videoUrl: string | null;
    assignedTeamAId: string | null;
    assignedTeamBId: string | null;
    assignedTeamA: Team | null;
    assignedTeamB: Team | null;
    uploadedAt: Date;
}