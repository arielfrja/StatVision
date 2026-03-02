import { DataSource } from "typeorm";
import { GameEventRepository } from "../../repository/GameEventRepository";
import { GameStatsService } from "../../service/GameStatsService";
import { GameRepository } from "../../repository/GameRepository";
import { GameStatus } from "../../core/entities/Game";
import logger from "../../config/logger";

interface AssignmentData {
    teamMappings: { tempTeamId: string; officialTeamId: string }[];
    playerMappings: { tempPlayerId: string; officialPlayerId: string }[];
}

export class GameAssignmentService {
    private gameEventRepository: GameEventRepository;
    private gameRepository: GameRepository;
    private gameStatsService: GameStatsService;

    constructor(dataSource: DataSource, gameStatsService: GameStatsService) {
        this.gameEventRepository = new GameEventRepository(dataSource);
        this.gameRepository = new GameRepository(dataSource);
        this.gameStatsService = gameStatsService;
    }

    async assignEntities(gameId: string, data: AssignmentData): Promise<void> {
        logger.info(`GameAssignmentService: Starting assignment for game ${gameId}.`);

        // Transactional assignment
        await this.gameEventRepository.manager.transaction(async (transactionalEntityManager) => {
             // 1. Update GameEvents in batch
            // Note: GameEventRepository methods might need to be transaction-aware or we use the transactionalEntityManager directly
            // For now, assuming the repository handles the simple updates, but ideally we pass the manager.
            // A better pattern:
            
            for (const teamMap of data.teamMappings) {
                await transactionalEntityManager.createQueryBuilder()
                    .update("GameEvent")
                    .set({ assignedTeamId: teamMap.officialTeamId })
                    .where("gameId = :gameId", { gameId })
                    .andWhere("assignedTeamId = :tempTeamId", { tempTeamId: teamMap.tempTeamId })
                    .execute();
            }

            for (const playerMap of data.playerMappings) {
                 await transactionalEntityManager.createQueryBuilder()
                    .update("GameEvent")
                    .set({ assignedPlayerId: playerMap.officialPlayerId })
                    .where("gameId = :gameId", { gameId })
                    .andWhere("assignedPlayerId = :tempPlayerId", { tempPlayerId: playerMap.tempPlayerId })
                    .execute();
            }
        });

        // 2. Clear existing stats
        await this.gameStatsService.clearStatsForGame(gameId);

        // 3. Recalculate stats
        await this.gameStatsService.calculateAndStoreStats(gameId);

        // 4. Update Game status to COMPLETED if it was ANALYZED
        // We need to fetch the current status first
        const game = await this.gameRepository.findOneWithDetailsInternal(gameId);
        if (game && game.status === GameStatus.ANALYZED) {
            await this.gameRepository.updateStatus(gameId, GameStatus.COMPLETED);
        }

        logger.info(`GameAssignmentService: Assignment and stats recalculation complete for game ${gameId}.`);
    }
}
