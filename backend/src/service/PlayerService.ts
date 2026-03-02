import logger from "../config/logger";
import { PlayerRepository } from "../repository/PlayerRepository";
import { Team } from "../core/entities/Team";
import { Player } from "../core/entities/Player";
import { PlayerTeamHistory } from "../core/entities/PlayerTeamHistory";
import { DataSource } from "typeorm";
import { GameStatsService } from "./GameStatsService";
import { Game } from "../core/entities/Game";
import { GameEvent } from "../core/entities/GameEvent";

export class PlayerService {
    private playerRepository: PlayerRepository;

    constructor(
        private dataSource: DataSource,
        private gameStatsService: GameStatsService
    ) {
        this.playerRepository = new PlayerRepository(dataSource);
    }

    /**
     * Reassigns a player to the opposing team for a specific game and recalculates stats.
     */
    async switchPlayerTeam(playerId: string, gameId: string, userId: string): Promise<void> {
        logger.info(`PlayerService: Switching team for player ${playerId} in game ${gameId}`);

        const gameRepository = this.dataSource.getRepository(Game);
        const game = await gameRepository.findOne({ where: { id: gameId, userId: userId } });

        if (!game) throw new Error("Game not found or unauthorized.");

        const eventRepository = this.dataSource.getRepository(GameEvent);
        const playerEvents = await eventRepository.find({ where: { gameId, assignedPlayerId: playerId } });

        if (playerEvents.length === 0) {
            throw new Error("No events found for this player in this game.");
        }

        // Determine current team and opposing team
        const currentTeamId = playerEvents[0].assignedTeamId;
        const opposingTeamId = (currentTeamId === game.homeTeamId) ? game.awayTeamId : game.homeTeamId;

        if (!opposingTeamId) throw new Error("Opposing team not found for this game.");

        // Update all events for this player in this game
        await this.dataSource.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.update(GameEvent, 
                { gameId, assignedPlayerId: playerId }, 
                { assignedTeamId: opposingTeamId }
            );
        });

        // Recalculate stats for the whole game
        await this.gameStatsService.calculateAndStoreStats(gameId);
        logger.info(`PlayerService: Team switch and stat recalculation complete for player ${playerId}.`);
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
     * Retrieves all active PlayerTeamHistory records for all teams of a given user.
     */
    async getPlayersByUser(userId: string): Promise<PlayerTeamHistory[]> {
        logger.info(`PlayerService: Getting all players for user: ${userId}`);
        return this.playerRepository.findPlayersByUserId(userId);
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
