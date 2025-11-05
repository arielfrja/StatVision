import logger from "../config/logger";
import { Repository } from "typeorm";
import { Team } from "../Team";
import { User } from "../User";

export class TeamRepository {
    constructor(private teamBaseRepository: Repository<Team>) {}

    async save(team: Team): Promise<Team> {
        logger.info(`TeamRepository: Saving team: ${team.id || 'new'}`);
        return this.teamBaseRepository.save(team);
    }

    async findOneById(id: string): Promise<Team | null> {
        logger.info(`TeamRepository: Finding team by ID: ${id}`);
        return this.teamBaseRepository.findOneBy({ id });
    }

    async createTeam(name: string, user: User): Promise<Team> {
        logger.info(`TeamRepository: Creating team with name: ${name} for user: ${user.id}`);
        const team = this.teamBaseRepository.create({ name, user, userId: user.id });
        return this.teamBaseRepository.save(team);
    }

    async findTeamsByUser(userId: string): Promise<Team[]> {
        logger.info(`TeamRepository: Finding teams for user: ${userId}`);
        return this.teamBaseRepository.find({ where: { userId } });
    }

    async findTeamByIdAndUser(teamId: string, userId: string): Promise<Team | null> {
        logger.info(`TeamRepository: Finding team ${teamId} for user: ${userId}`);
        return this.teamBaseRepository.findOne({ where: { id: teamId, userId } });
    }

    async updateTeam(team: Team, newName: string): Promise<Team> {
        logger.info(`TeamRepository: Updating team ${team.id} to name: ${newName}`);
        team.name = newName;
        return this.teamBaseRepository.save(team);
    }

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        logger.info(`TeamRepository: Deleting team ${teamId} for user: ${userId}`);
        await this.teamBaseRepository.delete({ id: teamId, userId });
    }
}
