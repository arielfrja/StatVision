import { DataSource, Repository } from "typeorm";
import { GamePlayerStats } from "../entities";
import { ILogger } from "../interfaces/ILogger";

export class GamePlayerStatsRepository {
    private repository: Repository<GamePlayerStats>;

    constructor(
        dataSource: DataSource,
        private logger?: ILogger
    ) {
        this.repository = dataSource.getRepository(GamePlayerStats);
    }

    async save(stats: GamePlayerStats | GamePlayerStats[]): Promise<GamePlayerStats | GamePlayerStats[]> {
        return this.repository.save(stats as any);
    }

    create(data: Partial<GamePlayerStats>): GamePlayerStats {
        return this.repository.create(data);
    }

    async findByGameId(gameId: string): Promise<GamePlayerStats[]> {
        return this.repository.find({ where: { gameId }, relations: ["player"] });
    }

    async findOneByGameAndPlayer(gameId: string, playerId: string): Promise<GamePlayerStats | null> {
        return this.repository.findOne({ where: { gameId, playerId } });
    }

    async deleteByGameId(gameId: string): Promise<void> {
        this.logger?.info(`GamePlayerStatsRepository: Deleting stats for game ${gameId}`);
        await this.repository.delete({ gameId });
    }
}
