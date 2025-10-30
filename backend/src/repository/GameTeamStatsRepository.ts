import { DataSource, Repository } from "typeorm";
import { GameTeamStats } from "../GameTeamStats";

export class GameTeamStatsRepository {
    private repository: Repository<GameTeamStats>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(GameTeamStats);
    }

    // Add methods here if needed, otherwise it's just a wrapper for the base repository
    async save(stats: GameTeamStats[]): Promise<GameTeamStats[]> {
        return this.repository.save(stats);
    }

    create(stats: Partial<GameTeamStats>): GameTeamStats {
        return this.repository.create(stats);
    }
}