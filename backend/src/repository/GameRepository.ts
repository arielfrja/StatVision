import { DataSource, Repository } from "typeorm";
import { Game, GameStatus } from "../Game";
import { IGameRepository } from "./IGameRepository";
import logger from "../config/logger";

export class GameRepository implements IGameRepository {
    private repository: Repository<Game>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(Game);
    }

    async create(game: Game): Promise<Game> {
        logger.info(`Creating new game record for user ${game.userId}`);
        return this.repository.save(game);
    }

    async findOneById(gameId: string): Promise<Game | null> {
        return this.repository.findOne({ where: { id: gameId } });
    }

    async findOneByIdAndUserId(gameId: string, userId: string): Promise<Game | null> {
        return this.repository.findOne({ where: { id: gameId, userId: userId } });
    }

    async updateStatus(gameId: string, status: GameStatus, failedChunkInfo: { chunkPath: string; startTime: number; sequence: number; }[] | null = null): Promise<void> {
        logger.info(`Updating game ${gameId} status to ${status}`);

        const updateData: { status: GameStatus; failedChunkInfo?: { chunkPath: string; startTime: number; sequence: number; }[] | null } = { status: status };
        if (failedChunkInfo !== null) {
            updateData.failedChunkInfo = failedChunkInfo;
        }

        const result = await this.repository.update(
            { id: gameId },
            updateData
        );

        if (result.affected === 0) {
            logger.warn(`Game status update failed: Game ${gameId} not found.`);
            throw new Error(`Game ${gameId} not found for status update.`);
        }
        logger.info(`Game ${gameId} status successfully updated to ${status}.`);
    }

    async updateFilePathAndStatus(gameId: string, filePath: string, status: GameStatus): Promise<void> {
        logger.info(`Updating game ${gameId} file path to ${filePath} and status to ${status}`);
        
        // Note: The 'filePath' property maps to the 'video_url' column in the database.
        const result = await this.repository.update(
            { id: gameId },
            { filePath: filePath, status: status }
        );

        if (result.affected === 0) {
            logger.warn(`Game file path and status update failed: Game ${gameId} not found.`);
            throw new Error(`Game ${gameId} not found for file path and status update.`);
        }
        logger.info(`Game ${gameId} file path and status successfully updated.`);
    }


    async findAllByUserId(userId: string): Promise<Game[]> {
        return this.repository.find({
            where: { userId: userId },
            relations: ["homeTeam", "awayTeam"], // Eagerly load team data
            order: { uploadedAt: "DESC" }
        });
    }

    async findOneWithDetails(gameId: string, userId: string): Promise<Game | null> {
        return this.repository.findOne({
            where: { id: gameId, userId: userId },
            relations: [
                "events", // GameEvents
                "events.assignedTeam", // Team assigned to the event
                "events.assignedPlayer", // Player assigned to the event
                "homeTeam", // Home Team details
                "awayTeam", // Away Team details
                "teamStats", // GameTeamStats
                "teamStats.team", // Load team details for the stats record
                "playerStats", // GamePlayerStats
                "playerStats.player", // Load player details for the stats record
            ],
            order: {
                events: {
                    absoluteTimestamp: "ASC", // Order events chronologically
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

    async delete(gameId: string, userId: string): Promise<void> {
        logger.info(`Attempting to delete game ${gameId} for user ${userId} from the database.`);
        const result = await this.repository.delete({ id: gameId, userId: userId });

        if (result.affected === 0) {
            logger.warn(`Game deletion failed: Game ${gameId} not found for user ${userId}.`);
            throw new Error(`Game ${gameId} not found for user ${userId} for deletion.`);
        }
        logger.info(`Game ${gameId} successfully deleted from the database.`);
    }
}