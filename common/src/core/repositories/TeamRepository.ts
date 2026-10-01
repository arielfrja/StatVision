import { In, Repository } from "typeorm";
import { Team, User } from "../entities";
import { ILogger } from "../interfaces/ILogger";

export class TeamRepository {
    constructor(
        private teamBaseRepository: Repository<Team>,
        private logger?: ILogger
    ) {}

    async save(team: Team): Promise<Team> {
        this.logger?.info(`TeamRepository: Saving team: ${team.id || 'new'}`);
        return this.teamBaseRepository.save(team);
    }

    async findOneById(id: string): Promise<Team | null> {
        this.logger?.info(`TeamRepository: Finding team by ID: ${id}`);
        return this.teamBaseRepository.findOneBy({ id });
    }

    async createTeam(name: string, user: User): Promise<Team> {
        this.logger?.info(`TeamRepository: Creating team with name: ${name} for user: ${user.id}`);
        const team = this.teamBaseRepository.create({ name, user, userId: user.id });
        return this.teamBaseRepository.save(team);
    }

    async findTeamsByUser(userId: string): Promise<Team[]> {
        this.logger?.info(`TeamRepository: Finding teams for user: ${userId}`);
        return this.teamBaseRepository.find({ where: { userId } });
    }

    async findTeamByIdAndUser(teamId: string, userId: string): Promise<Team | null> {
        this.logger?.info(`TeamRepository: Finding team ${teamId} for user: ${userId}`);
        return this.teamBaseRepository.findOne({ where: { id: teamId, userId } });
    }

    /**
     * Case-insensitive name lookup scoped to a user.
     * Supports the application-level UNIQUE(userId, lower(name)) guard until the
     * DB-level unique index migration (UniqueTeamNamePerUser) is applied.
     */
    async findByNameLower(userId: string, name: string): Promise<Team | null> {
        this.logger?.info(`TeamRepository: Finding team by lower-cased name for user: ${userId}`);
        return this.teamBaseRepository
            .createQueryBuilder("team")
            .where("team.userId = :userId", { userId })
            .andWhere("LOWER(team.name) = LOWER(:name)", { name })
            .getOne();
    }

    async updateTeam(team: Team, newName: string): Promise<Team> {
        this.logger?.info(`TeamRepository: Updating team ${team.id} to name: ${newName}`);
        team.name = newName;
        return this.teamBaseRepository.save(team);
    }

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        this.logger?.info(`TeamRepository: Deleting team ${teamId} for user: ${userId}`);
        await this.teamBaseRepository.delete({ id: teamId, userId });
    }

    async findByIds(ids: string[]): Promise<Team[]> {
        this.logger?.info(`TeamRepository: Finding teams by IDs: ${ids.join(', ')}`);
        return this.teamBaseRepository.findBy({ id: In(ids) });
    }
}
