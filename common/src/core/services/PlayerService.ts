import { PlayerRepository } from "../repositories/PlayerRepository";
import { Player, PlayerTeamHistory, Game, GameEvent } from "../entities";
import { DataSource } from "typeorm";
import { GameStatsService } from "./GameStatsService";
import { ILogger } from "../interfaces/ILogger";

export class PlayerService {
    private playerRepository: PlayerRepository;

    constructor(
        private dataSource: DataSource,
        private gameStatsService: GameStatsService,
        private logger?: ILogger
    ) {
        this.playerRepository = new PlayerRepository(dataSource, logger);
    }

    async switchPlayerTeam(playerId: string, gameId: string, userId: string): Promise<void> {
        this.logger?.info(`PlayerService: Switching team for player ${playerId} in game ${gameId}`);

        const gameRepository = this.dataSource.getRepository(Game);
        const game = await gameRepository.findOne({ where: { id: gameId, userId: userId } });

        if (!game) throw new Error("Game not found or unauthorized.");

        const eventRepository = this.dataSource.getRepository(GameEvent);
        const playerEvents = await eventRepository.find({ where: { gameId, assignedPlayerId: playerId } });

        if (playerEvents.length === 0) {
            throw new Error("No events found for this player in this game.");
        }

        const currentTeamId = playerEvents[0].assignedTeamId;
        const opposingTeamId = (currentTeamId === game.homeTeamId) ? game.awayTeamId : game.homeTeamId;

        if (!opposingTeamId) throw new Error("Opposing team not found for this game.");

        await this.dataSource.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.update(GameEvent, 
                { gameId, assignedPlayerId: playerId }, 
                { assignedTeamId: opposingTeamId }
            );
        });

        await this.gameStatsService.calculateAndStoreStats(gameId);
        this.logger?.info(`PlayerService: Team switch and stat recalculation complete for player ${playerId}.`);
    }

    async createPlayerAndAssignToTeam(
        name: string, 
        teamId: string, 
        jerseyNumber: number | null, 
        description: string | null
    ): Promise<PlayerTeamHistory> {
        this.logger?.info(`PlayerService: Creating player ${name} and assigning to team ${teamId}`);
        
        if (!name || name.trim() === "") {
            throw new Error("Player name cannot be empty.");
        }

        const newPlayer = await this.playerRepository.createPlayer(name);
        const historyRecord = await this.playerRepository.assignPlayerToTeam(
            newPlayer.id, 
            teamId, 
            jerseyNumber, 
            description
        );

        return historyRecord;
    }

    async getPlayersByTeam(teamId: string): Promise<PlayerTeamHistory[]> {
        this.logger?.info(`PlayerService: Getting active players for team: ${teamId}`);
        return this.playerRepository.findActivePlayersByTeam(teamId);
    }

    async getPlayersByUser(userId: string): Promise<PlayerTeamHistory[]> {
        this.logger?.info(`PlayerService: Getting all players for user: ${userId}`);
        return this.playerRepository.findPlayersByUserId(userId);
    }

    async updatePlayerAssignment(
        playerId: string, 
        teamId: string, 
        jerseyNumber: number | null, 
        description: string | null
    ): Promise<PlayerTeamHistory> {
        this.logger?.info(`PlayerService: Updating assignment for player ${playerId} on team ${teamId}`);
        
        const history = await this.playerRepository.findHistoryRecord(playerId, teamId);
        if (!history) {
            throw new Error("Player not found on this team's roster.");
        }

        return this.playerRepository.updateHistoryRecord(history, jerseyNumber, description);
    }

    async removePlayerFromTeam(playerId: string, teamId: string): Promise<void> {
        this.logger?.info(`PlayerService: Removing player ${playerId} from team ${teamId} roster.`);
        await this.playerRepository.deleteHistoryRecord(playerId, teamId);
    }
}
