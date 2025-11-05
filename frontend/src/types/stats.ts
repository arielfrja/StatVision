export interface GameTeamStats {
    id: string;
    gameId: string;
    teamId: string;
    
    // Core Stats
    points: number;
    assists: number;

    // Detailed Stats
    offensiveRebounds: number;
    defensiveRebounds: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    effectiveFieldGoalPercentage: number;
    trueShootingPercentage: number;

    details: any;
}

export interface GamePlayerStats {
    id: string;
    gameId: string;
    playerId: string;

    // Player-specific metrics
    minutesPlayed: number;
    plusMinus: number;

    // Core Stats
    points: number;
    assists: number;

    // Detailed Stats
    offensiveRebounds: number;
    defensiveRebounds: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    effectiveFieldGoalPercentage: number;
    trueShootingPercentage: number;

    details: any;
}