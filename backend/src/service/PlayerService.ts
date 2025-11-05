import logger from "../config/logger";
import { PlayerRepository } from "../repository/PlayerRepository";
import { Team } from "../Team";
import { Player } from "../Player";
import { PlayerTeamHistory } from "../PlayerTeamHistory";
import { DataSource } from "typeorm";

export class PlayerService {
    private playerRepository: PlayerRepository;

    constructor(AppDataSource: DataSource) {
        this.playerRepository = new PlayerRepository(AppDataSource);
    }

    /**
     * Creates a new Player (timeless attributes) and assigns them to a team via PlayerTeamHistory.
     * This method is simplified for the MVP to create both the Player and the initial History record.
     */
    async createPlayerAndAssignToTeam(
        name: string, 
        teamId: string, 
        jerseyNumber: number | null, 
        description: string | null
    ): Promise<PlayerTeamHistory> {
        logger.info(`PlayerService: Creating player ${name} and assigning to team ${teamId}`);
        
        if (!name || name.trim() === "") {
            throw new Error("Player name cannot be empty.");
        }

        // 1. Create the timeless Player record
        const newPlayer = await this.playerRepository.createPlayer(name);

        // 2. Assign the new Player to the Team (creates PlayerTeamHistory record)
        const historyRecord = await this.playerRepository.assignPlayerToTeam(
            newPlayer.id, 
            teamId, 
            jerseyNumber, 
            description
        );

        return historyRecord;
    }

    /**
     * Retrieves all active PlayerTeamHistory records for a given team.
     */
    async getPlayersByTeam(teamId: string): Promise<PlayerTeamHistory[]> {
        logger.info(`PlayerService: Getting active players for team: ${teamId}`);
        return this.playerRepository.findActivePlayersByTeam(teamId);
    }

    /**
     * Updates the assignment details (jersey, description) for a player on a specific team.
     */
    async updatePlayerAssignment(
        playerId: string, 
        teamId: string, 
        jerseyNumber: number | null, 
        description: string | null
    ): Promise<PlayerTeamHistory> {
        logger.info(`PlayerService: Updating assignment for player ${playerId} on team ${teamId}`);
        
        const history = await this.playerRepository.findHistoryRecord(playerId, teamId);
        if (!history) {
            throw new Error("Player not found on this team's roster.");
        }

        return this.playerRepository.updateHistoryRecord(history, jerseyNumber, description);
    }

    /**
     * Removes a player from a team's roster by deleting the PlayerTeamHistory record.
     */
    async removePlayerFromTeam(playerId: string, teamId: string): Promise<void> {
        logger.info(`PlayerService: Removing player ${playerId} from team ${teamId} roster.`);
        await this.playerRepository.deleteHistoryRecord(playerId, teamId);
    }
}
