import { DataSource, Repository } from "typeorm";
import { GameTeamStats } from "../entities";
import { ILogger } from "../interfaces/ILogger";

export class GameTeamStatsRepository {
    private repository: Repository<GameTeamStats>;

    constructor(
        dataSource: DataSource,
        private logger?: ILogger
    ) {
        this.repository = dataSource.getRepository(GameTeamStats);
    }

    async save(stats: GameTeamStats | GameTeamStats[]): Promise<GameTeamStats | GameTeamStats[]> {
        return this.repository.save(stats as any);
    }

    create(data: Partial<GameTeamStats>): GameTeamStats {
        return this.repository.create(data);
    }

    async findByGameId(gameId: string): Promise<GameTeamStats[]> {
        return this.repository.find({ where: { gameId }, relations: ["team"] });
    }

    async findOneByGameAndTeam(gameId: string, teamId: string): Promise<GameTeamStats | null> {
        return this.repository.findOne({ where: { gameId, teamId } });
    }

    async deleteByGameId(gameId: string): Promise<void> {
        this.logger?.info(`GameTeamStatsRepository: Deleting stats for game ${gameId}`);
        await this.repository.delete({ gameId });
    }
}
