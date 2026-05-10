import { DataSource } from "typeorm";
import { GameEventRepository, GameStatsService, GameRepository, GameEvent } from "@statvision/common";
import { jobLogger as logger } from "../../config/loggers";

export class GameAssignmentService {
    private gameEventRepository: GameEventRepository;
    private gameRepository: GameRepository;

    constructor(
        private dataSource: DataSource,
        private gameStatsService: GameStatsService
    ) {
        this.gameEventRepository = new GameEventRepository(dataSource);
        this.gameRepository = new GameRepository(dataSource);
    }

    async assignEntity(gameId: string, tempId: string, realId: string, type: 'team' | 'player', userId: string): Promise<void> {
        logger.info(`GameAssignmentService: Assigning temp ${type} ${tempId} to real ID ${realId} for game ${gameId}`);

        const game = await this.gameRepository.findOneByIdAndUserId(gameId, userId);
        if (!game) throw new Error("Game not found or unauthorized.");

        await this.dataSource.transaction(async (transactionalEntityManager) => {
            if (type === 'team') {
                await transactionalEntityManager.update(GameEvent, { gameId, assignedTeamId: tempId }, { assignedTeamId: realId });
            } else {
                await transactionalEntityManager.update(GameEvent, { gameId, assignedPlayerId: tempId }, { assignedPlayerId: realId });
            }
        });

        await this.gameStatsService.calculateAndStoreStats(gameId);
        logger.info(`GameAssignmentService: Assignment and stat recalculation complete.`);
    }
}
