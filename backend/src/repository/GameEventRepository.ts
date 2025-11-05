import { DataSource, Repository } from "typeorm";
import { GameEvent } from "../GameEvent";
import logger from "../config/logger";

export class GameEventRepository {
    private repository: Repository<GameEvent>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(GameEvent);
    }

    /**
     * Inserts an array of GameEvent entities into the database in a single batch operation.
     * @param events An array of GameEvent entities to insert.
     * @returns A promise that resolves when the insertion is complete.
     */
    async batchInsert(events: GameEvent[]): Promise<void> {
        if (events.length === 0) {
            logger.warn("Attempted batch insert with an empty array of GameEvents.");
            return;
        }
        
        logger.info(`Starting batch insert for ${events.length} GameEvents.`);
        
        // Use the internal repository instance
        await this.repository.save(events);
        
        logger.info(`Successfully completed batch insert for ${events.length} GameEvents.`);
    }

    async findOne(options: any): Promise<GameEvent | null> {
        return this.repository.findOne(options);
    }

    async save(event: GameEvent): Promise<GameEvent> {
        return this.repository.save(event);
    }
}