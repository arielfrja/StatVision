import { DataSource, In } from "typeorm";
import { GameEventRepository, GameStatsService, GameRepository, Team, Player, GameEvent, Game, GameStatus } from "@statvision/common";
import logger from "../../config/logger";

export interface AssignmentDiff {
    /** Number of GameEvent rows re-pointed from the temp entity to the official one. */
    movedEvents: number;
    /** Game's home/away links after the temp -> official move. */
    newHomeAway: { homeTeamId: string | null; awayTeamId: string | null };
    /** Game status after the fully-resolved check. */
    newStatus: GameStatus;
}

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

    async assignEntity(gameId: string, tempId: string, realId: string, type: 'team' | 'player', userId: string): Promise<AssignmentDiff> {
        logger.info(`GameAssignmentService: Assigning temp ${type} ${tempId} to real ID ${realId} for game ${gameId}`);

        const game = await this.gameRepository.findOneByIdAndUserId(gameId, userId);
        if (!game) throw new Error("Game not found or unauthorized.");

        let movedEvents = 0;
        await this.dataSource.transaction(async (transactionalEntityManager) => {
            if (type === 'team') {
                const result = await transactionalEntityManager.update(GameEvent, { gameId, assignedTeamId: tempId }, { assignedTeamId: realId });
                movedEvents = result.affected ?? 0;
                // Move the game's team links along: temp -> official.
                if (game.homeTeamId === tempId) game.homeTeamId = realId;
                if (game.awayTeamId === tempId) game.awayTeamId = realId;
                await transactionalEntityManager.save(Game, game);
            } else {
                const result = await transactionalEntityManager.update(GameEvent, { gameId, assignedPlayerId: tempId }, { assignedPlayerId: realId });
                movedEvents = result.affected ?? 0;
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

        // NOTE (zero-token): calculateAndStoreStats is a local deterministic
        // re-aggregation over stored GameEvents — it makes no LLM/token calls.
        return {
            movedEvents,
            newHomeAway: { homeTeamId: game.homeTeamId ?? null, awayTeamId: game.awayTeamId ?? null },
            newStatus: game.status,
        };
    }
}
