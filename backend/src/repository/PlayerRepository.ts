import logger from "../config/logger";
import { DataSource, Repository } from "typeorm";
import { Player } from "../Player";
import { Team } from "../Team";
import { PlayerTeamHistory } from "../PlayerTeamHistory";

export class PlayerRepository {
    private playerBaseRepository: Repository<Player>;
    private playerHistoryRepository: Repository<PlayerTeamHistory>;

    constructor(dataSource: DataSource) {
        this.playerBaseRepository = dataSource.getRepository(Player);
        this.playerHistoryRepository = dataSource.getRepository(PlayerTeamHistory);
    }

    async save(player: Player): Promise<Player> {
        logger.info(`PlayerRepository: Saving player: ${player.id || 'new'}`);
        return this.playerBaseRepository.save(player);
    }

    async findOneById(id: string): Promise<Player | null> {
        logger.info(`PlayerRepository: Finding player by ID: ${id}`);
        return this.playerBaseRepository.findOneBy({ id });
    }

    /**
     * Creates a new Player record (timeless attributes).
     */
    async createPlayer(name: string): Promise<Player> {
        logger.info(`PlayerRepository: Creating player ${name}`);
        const player = this.playerBaseRepository.create({ name });
        return this.playerBaseRepository.save(player);
    }

    /**
     * Creates a new PlayerTeamHistory record (roster assignment).
     */
    async assignPlayerToTeam(playerId: string, teamId: string, jerseyNumber: number | null, description: string | null): Promise<PlayerTeamHistory> {
        logger.info(`PlayerRepository: Assigning player ${playerId} to team ${teamId} with jersey ${jerseyNumber}`);
        const history = this.playerHistoryRepository.create({ 
            playerId, 
            teamId, 
            jerseyNumber, 
            description,
            startDate: new Date(), // Default start date to now
        });
        return this.playerHistoryRepository.save(history);
    }

    /**
     * Finds all active players for a given team, including their history details.
     */
    async findActivePlayersByTeam(teamId: string): Promise<PlayerTeamHistory[]> {
        logger.info(`PlayerRepository: Finding active players for team: ${teamId}`);
        // This query assumes an "active" player is one with a history record for the team
        return this.playerHistoryRepository.find({ 
            where: { teamId },
            relations: ["player"], // Load the timeless Player details
        });
    }

    /**
     * Finds a specific PlayerTeamHistory record.
     */
    async findHistoryRecord(playerId: string, teamId: string): Promise<PlayerTeamHistory | null> {
        return this.playerHistoryRepository.findOne({ where: { playerId, teamId } });
    }

    /**
     * Updates a PlayerTeamHistory record.
     */
    async updateHistoryRecord(history: PlayerTeamHistory, jerseyNumber: number | null, description: string | null): Promise<PlayerTeamHistory> {
        history.jerseyNumber = jerseyNumber;
        history.description = description;
        return this.playerHistoryRepository.save(history);
    }

    /**
     * Deletes a PlayerTeamHistory record (removes player from roster).
     */
    async deleteHistoryRecord(playerId: string, teamId: string): Promise<void> {
        logger.info(`PlayerRepository: Deleting player ${playerId} from team ${teamId} roster.`);
        await this.playerHistoryRepository.delete({ playerId, teamId });
    }
}