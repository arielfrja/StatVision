import { Player } from "./player";

export interface Team {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    // Note: The players property is removed as the relationship is now M:N via PlayerTeamHistory
}