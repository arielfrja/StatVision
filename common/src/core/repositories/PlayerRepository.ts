import { DataSource, In, Repository } from "typeorm";
import { Player, PlayerTeamHistory } from "../entities";
import { ILogger } from "../interfaces/ILogger";

export class PlayerRepository {
    private playerBaseRepository: Repository<Player>;
    private playerHistoryRepository: Repository<PlayerTeamHistory>;

    constructor(
        dataSource: DataSource,
        private logger?: ILogger
    ) {
        this.playerBaseRepository = dataSource.getRepository(Player);
        this.playerHistoryRepository = dataSource.getRepository(PlayerTeamHistory);
    }

    async save(player: Player): Promise<Player> {
        this.logger?.info(`PlayerRepository: Saving player: ${player.id || 'new'}`);
        return this.playerBaseRepository.save(player);
    }

    async findOneById(id: string): Promise<Player | null> {
        this.logger?.info(`PlayerRepository: Finding player by ID: ${id}`);
        return this.playerBaseRepository.findOneBy({ id });
    }

    async createPlayer(name: string): Promise<Player> {
        this.logger?.info(`PlayerRepository: Creating player ${name}`);
        const player = this.playerBaseRepository.create({ name });
        return this.playerBaseRepository.save(player);
    }

    async assignPlayerToTeam(playerId: string, teamId: string, jerseyNumber: number | null, description: string | null): Promise<PlayerTeamHistory> {
        this.logger?.info(`PlayerRepository: Assigning player ${playerId} to team ${teamId} with jersey ${jerseyNumber}`);
        const history = this.playerHistoryRepository.create({ 
            playerId, 
            teamId, 
            jerseyNumber, 
            description,
            startDate: new Date(), 
        });
        return this.playerHistoryRepository.save(history);
    }

    async findPlayerByJerseyAndTeam(teamId: string, jerseyNumber: number, date?: Date): Promise<PlayerTeamHistory | null> {
        const query = this.playerHistoryRepository.createQueryBuilder("history")
            .where("history.teamId = :teamId", { teamId })
            .andWhere("history.jerseyNumber = :jerseyNumber", { jerseyNumber });
        
        if (date) {
            query.andWhere("(history.startDate IS NULL OR history.startDate <= :date)", { date })
                 .andWhere("(history.endDate IS NULL OR history.endDate >= :date)", { date });
        }
        
        return query.getOne();
    }

    async findActivePlayersByTeam(teamId: string): Promise<PlayerTeamHistory[]> {
        this.logger?.info(`PlayerRepository: Finding active players for team: ${teamId}`);
        return this.playerHistoryRepository.find({ 
            where: { teamId },
            relations: ["player"], 
        });
    }

    async findHistoryRecord(playerId: string, teamId: string): Promise<PlayerTeamHistory | null> {
        return this.playerHistoryRepository.findOne({ where: { playerId, teamId } });
    }

    async updateHistoryRecord(history: PlayerTeamHistory, jerseyNumber: number | null, description: string | null): Promise<PlayerTeamHistory> {
        history.jerseyNumber = jerseyNumber;
        history.description = description;
        return this.playerHistoryRepository.save(history);
    }

    async deleteHistoryRecord(playerId: string, teamId: string): Promise<void> {
        this.logger?.info(`PlayerRepository: Deleting player ${playerId} from team ${teamId} roster.`);
        await this.playerHistoryRepository.delete({ playerId, teamId });
    }

    async findByIds(ids: string[]): Promise<Player[]> {
        this.logger?.info(`PlayerRepository: Finding players by IDs: ${ids.join(', ')}`);
        return this.playerBaseRepository.findBy({ id: In(ids) });
    }

    async findPlayersByUserId(userId: string): Promise<PlayerTeamHistory[]> {
        this.logger?.info(`PlayerRepository: Finding all players for user: ${userId}`);
        return this.playerHistoryRepository.createQueryBuilder("history")
            .innerJoinAndSelect("history.player", "player")
            .innerJoin("history.team", "team")
            .where("team.userId = :userId", { userId })
            .getMany();
    }
}
