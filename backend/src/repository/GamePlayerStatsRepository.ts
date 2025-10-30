import { DataSource, Repository } from "typeorm";
import { GamePlayerStats } from "../GamePlayerStats";

export class GamePlayerStatsRepository {
    private repository: Repository<GamePlayerStats>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(GamePlayerStats);
    }

    // Add methods here if needed, otherwise it's just a wrapper for the base repository
    async save(stats: GamePlayerStats[]): Promise<GamePlayerStats[]> {
        return this.repository.save(stats);
    }

    create(stats: Partial<GamePlayerStats>): GamePlayerStats {
        return this.repository.create(stats);
    }
}