import { DataSource, Repository } from "typeorm";
import { Game, GameStatus } from "../entities";
import { IGameRepository } from "./IGameRepository";
import { ILogger } from "../interfaces/ILogger";

export class GameRepository implements IGameRepository {
    private repository: Repository<Game>;

    constructor(
        dataSource: DataSource,
        private logger?: ILogger
    ) {
        this.repository = dataSource.getRepository(Game);
    }

    async create(game: Game): Promise<Game> {
        this.logger?.info(`Creating new game record for user ${game.userId}`);
        return this.repository.save(game);
    }

    async findOneById(gameId: string): Promise<Game | null> {
        return this.repository.findOne({ where: { id: gameId } });
    }

    async findOneByIdAndUserId(gameId: string, userId: string): Promise<Game | null> {
        return this.repository.findOne({ where: { id: gameId, userId: userId } });
    }

    async updateStatus(gameId: string, status: GameStatus, failedChunkInfo: { chunkPath: string; startTime: number; sequence: number; }[] | null = null): Promise<void> {
        this.logger?.info(`Updating game ${gameId} status to ${status}`);

        const updateData: { status: GameStatus; failedChunkInfo?: { chunkPath: string; startTime: number; sequence: number; }[] | null } = { status: status };
        if (failedChunkInfo !== null) {
            updateData.failedChunkInfo = failedChunkInfo;
        }

        const result = await this.repository.update(
            { id: gameId },
            updateData
        );

        if (result.affected === 0) {
            this.logger?.warn(`Game status update failed: Game ${gameId} not found.`);
            throw new Error(`Game ${gameId} not found for status update.`);
        }
        this.logger?.info(`Game ${gameId} status successfully updated to ${status}.`);
    }

    async updateFilePathAndStatus(gameId: string, filePath: string, status: GameStatus): Promise<void> {
        this.logger?.info(`Updating game ${gameId} file path to ${filePath} and status to ${status}`);
        
        const result = await this.repository.update(
            { id: gameId },
            { filePath: filePath, status: status }
        );

        if (result.affected === 0) {
            this.logger?.warn(`Game file path and status update failed: Game ${gameId} not found.`);
            throw new Error(`Game ${gameId} not found for file path and status update.`);
        }
        this.logger?.info(`Game ${gameId} file path and status successfully updated.`);
    }


    async findAllByUserId(userId: string): Promise<Game[]> {
        return this.repository.find({
            where: { userId: userId },
            relations: ["homeTeam", "awayTeam"], 
            order: { uploadedAt: "DESC" }
        });
    }

    async findOneWithDetails(gameId: string, userId: string): Promise<Game | null> {
        return this.repository.findOne({
            where: { id: gameId, userId: userId },
            relations: [
                "events", 
                "events.assignedTeam", 
                "events.assignedPlayer", 
                "homeTeam", 
                "awayTeam", 
                "teamStats", 
                "teamStats.team", 
                "playerStats", 
                "playerStats.player", 
            ],
            order: {
                events: {
                    absoluteTimestamp: "ASC", 
                }
            }
        });
    }

    async findOneWithDetailsInternal(gameId: string): Promise<Game | null> {
        return this.repository.findOne({
            where: { id: gameId },
            relations: [
                "events",
                "events.assignedTeam",
                "events.assignedPlayer",
                "homeTeam",
                "awayTeam",
                "teamStats",
                "playerStats",
            ],
            order: {
                events: {
                    absoluteTimestamp: "ASC",
                }
            }
        });
    }

    async save(game: Game): Promise<Game> {
        return this.repository.save(game);
    }

    async delete(gameId: string, userId: string): Promise<void> {
        this.logger?.info(`Attempting to delete game ${gameId} for user ${userId} from the database.`);
        const result = await this.repository.delete({ id: gameId, userId: userId });

        if (result.affected === 0) {
            this.logger?.warn(`Game deletion failed: Game ${gameId} not found for user ${userId}.`);
            throw new Error(`Game ${gameId} not found for user ${userId} for deletion.`);
        }
        this.logger?.info(`Game ${gameId} successfully deleted from the database.`);
    }
}
