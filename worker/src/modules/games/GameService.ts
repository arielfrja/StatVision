import { GameRepository, User, Game, GameType, IdentityMode, GameStatus } from "@statvision/common";
import { DataSource } from "typeorm";
import { jobLogger as logger } from "../../config/loggers";

export class GameService {
    private gameRepository: GameRepository;

    constructor(dataSource: DataSource) {
        this.gameRepository = new GameRepository(dataSource);
    }

    async createGame(data: {
        homeTeamId: string;
        awayTeamId: string;
        gameDate: Date;
        gameType: GameType;
        identityMode: IdentityMode;
        visualContext?: any;
    }, user: User): Promise<Game> {
        logger.info(`GameService: Creating game for user ${user.id}`);
        const game = new Game();
        Object.assign(game, data);
        game.userId = user.id;
        game.status = GameStatus.PENDING;
        return this.gameRepository.create(game);
    }

    async getGamesByUser(userId: string): Promise<Game[]> {
        return this.gameRepository.findAllByUserId(userId);
    }

    async getGameDetails(gameId: string, userId: string): Promise<Game | null> {
        return this.gameRepository.findOneWithDetails(gameId, userId);
    }

    async deleteGame(gameId: string, userId: string): Promise<void> {
        logger.info(`GameService: Deleting game ${gameId} for user ${userId}`);
        await this.gameRepository.delete(gameId, userId);
    }
}
