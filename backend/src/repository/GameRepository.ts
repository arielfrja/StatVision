import { DataSource, Repository } from "typeorm";
import { Game, GameStatus } from "../Game";
import { IGameRepository } from "./IGameRepository";
import logger from "../config/logger";

export class GameRepository implements IGameRepository {
    private repository: Repository<Game>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(Game);
    }

    async findOneByIdAndUserId(gameId: string, userId: string): Promise<Game | null> {
        return this.repository.findOne({ where: { id: gameId, userId: userId } });
    }

    async updateStatus(gameId: string, status: GameStatus): Promise<void> {
        logger.info(`Updating game ${gameId} status to ${status}`);
        
        const result = await this.repository.update(
            { id: gameId },
            { status: status }
        );

        if (result.affected === 0) {
            logger.warn(`Game status update failed: Game ${gameId} not found.`);
            throw new Error(`Game ${gameId} not found for status update.`);
        }
        logger.info(`Game ${gameId} status successfully updated to ${status}.`);
    }

    async findAllByUserId(userId: string): Promise<Game[]> {
        return this.repository.find({
            where: { userId: userId },
            relations: ["assignedTeamA", "assignedTeamB"], // Eagerly load team data
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
                "assignedTeamA", // Team A details
                "assignedTeamB", // Team B details
            ],
            order: {
                events: {
                    absoluteTimestamp: "ASC", // Order events chronologically
                }
            }
        });
    }
}