import { PlayerTeamHistory } from "./player";

export interface Team {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    
    // UI Compatibility
    isTemp?: boolean;
    players?: PlayerTeamHistory[];
}

export interface TeamWithPlayers extends Team {
    players: PlayerTeamHistory[];
}
