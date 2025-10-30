export interface GameTeamStats {
    id: string;
    gameId: string;
    teamId: string;
    points: number;
    rebounds: number;
    assists: number;
    details: any;
}

export interface GamePlayerStats {
    id: string;
    gameId: string;
    playerId: string;
    points: number;
    rebounds: number;
    assists: number;
    details: any;
}