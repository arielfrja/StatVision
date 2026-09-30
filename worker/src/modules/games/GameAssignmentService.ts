import { DataSource, In } from "typeorm";
import { GameEventRepository, GameStatsService, GameRepository, Team, Player, GameEvent, Game, GameStatus } from "@statvision/common";
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
                // Move the game's team links along: temp -> official.
                if (game.homeTeamId === tempId) game.homeTeamId = realId;
                if (game.awayTeamId === tempId) game.awayTeamId = realId;
                await transactionalEntityManager.save(Game, game);
            } else {
                await transactionalEntityManager.update(GameEvent, { gameId, assignedPlayerId: tempId }, { assignedPlayerId: realId });
            }
        });

        // "Const" rule: once no event references a temp entity anymore,
        // the game's data is fully resolved -> COMPLETED.
        const allEvents = await this.dataSource.getRepository(GameEvent).find({
            where: { gameId },
            select: ['assignedTeamId', 'assignedPlayerId'],
        });
        const teamIds = [...new Set(allEvents.map(e => e.assignedTeamId).filter((id): id is string => !!id))];
        const playerIds = [...new Set(allEvents.map(e => e.assignedPlayerId).filter((id): id is string => !!id))];
        let hasTempRefs = false;
        if (teamIds.length > 0) {
            hasTempRefs = await this.dataSource.getRepository(Team).countBy({ id: In(teamIds), isTemp: true }) > 0;
        }
        if (!hasTempRefs && playerIds.length > 0) {
            hasTempRefs = await this.dataSource.getRepository(Player).countBy({ id: In(playerIds), isTemp: true }) > 0;
        }
        if (!hasTempRefs) {
            game.status = GameStatus.COMPLETED;
            await this.gameRepository.save(game);
            logger.info(`GameAssignmentService: Game ${gameId} fully resolved -> COMPLETED.`);
        }

        await this.gameStatsService.calculateAndStoreStats(gameId);
        logger.info(`GameAssignmentService: Assignment and stat recalculation complete.`);
    }
}
