import { GameRepository, User, Game, GameType, IdentityMode, GameStatus } from "@statvision/common";
import { DataSource } from "typeorm";
import logger from "../../config/logger";

export class GameService {
    private gameRepository: GameRepository;

    constructor(dataSource: DataSource) {
        this.gameRepository = new GameRepository(dataSource);
    }

    async createGame(data: Partial<Game>, user: User): Promise<Game> {
        logger.info(`GameService: Creating game for user ${user.id}`);
        const game = new Game();
        Object.assign(game, data);
        
        if (!game.name) {
            const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
            const shortId = Math.random().toString(36).substring(2, 8);
            game.name = `Draft Game ${dateStr} [${shortId}]`;
        }

        game.userId = user.id;
        game.status = data.status || GameStatus.PENDING;
        game.gameType = data.gameType || GameType.FULL_COURT;
        game.identityMode = data.identityMode || IdentityMode.JERSEY_COLORS;
        
        return this.gameRepository.create(game);
    }

    async updateGame(gameId: string, userId: string, data: Partial<Game>): Promise<Game | null> {
        logger.info(`GameService: Updating game ${gameId} for user ${userId}`);
        const game = await this.gameRepository.findOneWithDetails(gameId, userId);
        if (!game) return null;

        // Prevent overwriting core fields if not provided
        const updatableFields: (keyof Game)[] = [
            'name', 'gameDate', 'location', 'homeTeamId', 'awayTeamId', 
            'gameType', 'identityMode', 'ruleset', 'visualContext', 'status'
        ];

        for (const field of updatableFields) {
            if (data[field] !== undefined) {
                (game as any)[field] = data[field];
            }
        }

        return this.gameRepository.save(game);
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
