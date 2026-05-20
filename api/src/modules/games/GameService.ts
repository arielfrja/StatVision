import { GameRepository, User, Game, GameType, IdentityMode, GameStatus, IStorageProvider, VideoAnalysisJob, Chunk } from "@statvision/common";
import { DataSource } from "typeorm";
import logger from "../../config/logger";

export class GameService {
    private gameRepository: GameRepository;

    constructor(private dataSource: DataSource, private storageProvider?: IStorageProvider) {
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
        
        const game = await this.gameRepository.findOneWithDetails(gameId, userId);
        if (!game) return;

        const jobRepository = this.dataSource.getRepository(VideoAnalysisJob);
        const chunkRepository = this.dataSource.getRepository(Chunk);

        // 1. Cleanup Storage
        if (this.storageProvider) {
            // Cleanup Source Video
            if (game.filePath) {
                try {
                    let remotePath = game.filePath;
                    if (remotePath.startsWith('gs://')) {
                        const uriParts = remotePath.split('/');
                        remotePath = uriParts.slice(3).join('/');
                    }
                    logger.info(`GameService: Deleting source file from storage: ${remotePath}`);
                    await this.storageProvider.deleteFile(remotePath);
                } catch (error) {
                    logger.warn(`GameService: Failed to delete source file for game ${gameId}`, error);
                }
            }

            // Cleanup Chunks in Storage
            try {
                const jobs = await jobRepository.find({ where: { gameId } });
                for (const job of jobs) {
                    const chunks = await chunkRepository.find({ where: { jobId: job.id } });
                    for (const chunk of chunks) {
                        if (chunk.chunkPath && chunk.chunkPath.startsWith('gs://')) {
                            const uriParts = chunk.chunkPath.split('/');
                            const remotePath = uriParts.slice(3).join('/');
                            logger.debug(`GameService: Deleting chunk file: ${remotePath}`);
                            await this.storageProvider.deleteFile(remotePath).catch(() => {});
                        }
                    }
                }
            } catch (error) {
                logger.warn(`GameService: Error during chunk storage cleanup for game ${gameId}`, error);
            }
        }

        // 2. Cleanup Database
        // Cascade delete on chunks is handled by DB if job is deleted.
        // But we need to delete the jobs first.
        await jobRepository.delete({ gameId });
        await this.gameRepository.delete(gameId, userId);
    }
}
