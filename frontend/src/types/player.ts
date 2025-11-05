export interface Player {
    id: string;
    name: string;
    position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | null;
    height: number | null; // in cm
    weight: number | null; // in kg
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PlayerTeamHistory {
    id: string;
    playerId: string;
    teamId: string;
    jerseyNumber: number | null;
    description: string | null;
    startDate: Date | null;
    endDate: Date | null;
}