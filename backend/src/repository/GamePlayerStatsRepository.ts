import { DataSource, Repository } from "typeorm";
import { GamePlayerStats } from "../GamePlayerStats";

export class GamePlayerStatsRepository {
    private repository: Repository<GamePlayerStats>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(GamePlayerStats);
    }

    // Add methods here if needed, otherwise it's just a wrapper for the base repository
    async save(stats: GamePlayerStats | GamePlayerStats[]): Promise<GamePlayerStats | GamePlayerStats[]> {
        return this.repository.save(stats as any); // TypeORM's save method handles both single and array
    }

    create(stats: Partial<GamePlayerStats>): GamePlayerStats {
        return this.repository.create(stats);
    }

    async findOneByGameAndPlayer(gameId: string, playerId: string): Promise<GamePlayerStats | null> {
        return this.repository.findOne({ where: { gameId, playerId } });
    }

    async findByGameId(gameId: string): Promise<GamePlayerStats[]> {
        return this.repository.find({ where: { gameId } });
    }
}