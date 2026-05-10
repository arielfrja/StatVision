import { TeamRepository } from "../repositories/TeamRepository";
import { User, Team } from "../entities";
import { DataSource } from "typeorm";
import { ILogger } from "../interfaces/ILogger";

export class TeamService {
    private teamRepository: TeamRepository;

    constructor(
        AppDataSource: DataSource,
        private logger?: ILogger
    ) {
        const teamBaseRepository = AppDataSource.getRepository(Team);
        this.teamRepository = new TeamRepository(teamBaseRepository, logger);
    }

    async createTeam(name: string, user: User): Promise<Team> {
        this.logger?.info(`TeamService: Creating team with name: ${name} for user: ${user.id}`);
        if (!name || name.trim() === "") {
            throw new Error("Team name cannot be empty.");
        }
        return this.teamRepository.createTeam(name, user);
    }

    async getTeamsByUser(userId: string): Promise<Team[]> {
        this.logger?.info(`TeamService: Getting teams for user: ${userId}`);
        return this.teamRepository.findTeamsByUser(userId);
    }

    async getTeamByIdAndUser(teamId: string, userId: string): Promise<Team | null> {
        this.logger?.info(`TeamService: Getting team ${teamId} for user: ${userId}`);
        return this.teamRepository.findTeamByIdAndUser(teamId, userId);
    }

    async updateTeam(teamId: string, userId: string, newName: string): Promise<Team> {
        this.logger?.info(`TeamService: Updating team ${teamId} for user: ${userId} to name: ${newName}`);
        const team = await this.teamRepository.findTeamByIdAndUser(teamId, userId);
        if (!team) {
            throw new Error("Team not found or you do not have permission to update it.");
        }
        if (!newName || newName.trim() === "") {
            throw new Error("Team name cannot be empty.");
        }
        return this.teamRepository.updateTeam(team, newName);
    }

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        this.logger?.info(`TeamService: Deleting team ${teamId} for user: ${userId}`);
        const team = await this.teamRepository.findTeamByIdAndUser(teamId, userId);
        if (!team) {
            throw new Error("Team not found or you do not have permission to delete it.");
        }
        await this.teamRepository.deleteTeam(teamId, userId);
    }
}
