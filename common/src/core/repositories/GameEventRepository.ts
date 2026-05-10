import { DataSource, In, Repository } from "typeorm";
import { GameEvent } from "../entities";
import { ILogger } from "../interfaces/ILogger";

export class GameEventRepository {
    private repository: Repository<GameEvent>;

    constructor(
        dataSource: DataSource,
        private logger?: ILogger
    ) {
        this.repository = dataSource.getRepository(GameEvent);
    }

    async create(event: GameEvent): Promise<GameEvent> {
        this.logger?.info(`GameEventRepository: Creating new event ${event.eventType} for game ${event.gameId}`);
        return this.repository.save(event);
    }

    async save(event: GameEvent): Promise<GameEvent> {
        return this.repository.save(event);
    }

    async batchInsert(events: GameEvent[]): Promise<void> {
        this.logger?.info(`GameEventRepository: Batch inserting ${events.length} events.`);
        await this.repository.save(events);
    }

    async findByGameId(gameId: string): Promise<GameEvent[]> {
        return this.repository.find({
            where: { gameId },
            order: { absoluteTimestamp: "ASC" },
            relations: ["assignedTeam", "assignedPlayer"]
        });
    }

    async deleteByGameId(gameId: string): Promise<void> {
        this.logger?.info(`GameEventRepository: Deleting all events for game ${gameId}`);
        await this.repository.delete({ gameId });
    }

    async findUniqueEntityIdsByGameId(gameId: string): Promise<{ teamIds: string[] }> {
        const events = await this.repository.find({
            where: { gameId },
            select: ["assignedTeamId"]
        });

        const teamIds = Array.from(new Set(events.map(e => e.assignedTeamId).filter(id => !!id))) as string[];
        return { teamIds };
    }

    async findUniquePlayerIdsByGameAndTeam(gameId: string, teamId: string): Promise<string[]> {
        const events = await this.repository.find({
            where: { gameId, assignedTeamId: teamId },
            select: ["assignedPlayerId"]
        });

        return Array.from(new Set(events.map(e => e.assignedPlayerId).filter(id => !!id))) as string[];
    }

    async findOneById(id: string): Promise<GameEvent | null> {
        return this.repository.findOne({ where: { id }, relations: ["assignedTeam", "assignedPlayer"] });
    }

    async delete(id: string): Promise<void> {
        this.logger?.info(`GameEventRepository: Deleting event ${id}`);
        await this.repository.delete(id);
    }
}
