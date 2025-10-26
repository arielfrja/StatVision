import { TeamRepository } from "../repository/TeamRepository";
import { User } from "../User";
import { Team } from "../Team";

export class TeamService {
    constructor(private teamRepository: TeamRepository) {}

    async createTeam(name: string, user: User): Promise<Team> {
        // Add any business logic validation here before creating the team
        if (!name || name.trim() === "") {
            throw new Error("Team name cannot be empty.");
        }
        return this.teamRepository.createTeam(name, user);
    }

    async getTeamsByUser(userId: string): Promise<Team[]> {
        return this.teamRepository.findTeamsByUser(userId);
    }

    async getTeamByIdAndUser(teamId: string, userId: string): Promise<Team | null> {
        return this.teamRepository.findTeamByIdAndUser(teamId, userId);
    }

    async updateTeam(teamId: string, userId: string, newName: string): Promise<Team> {
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
        const team = await this.teamRepository.findTeamByIdAndUser(teamId, userId);
        if (!team) {
            throw new Error("Team not found or you do not have permission to delete it.");
        }
        await this.teamRepository.deleteTeam(teamId, userId);
    }
}
