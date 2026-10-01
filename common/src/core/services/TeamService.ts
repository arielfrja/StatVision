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

    /**
     * Creates a team for the given user.
     *
     * Rules:
     * - Name is trimmed; whitespace-only names are rejected.
     * - Names are unique per user (case-insensitive).
     *
     * NOTE (DB constraint): run the `UniqueTeamNamePerUser` migration to enforce
     * UNIQUE(user_id, lower(name)) at the database level. Do NOT run ad-hoc
     * migrations against prod — the migration file is provided for the normal
     * release pipeline. Until it is applied, uniqueness is enforced here at the
     * application level and surfaced to callers as a DUPLICATE_TEAM_NAME error
     * (mapped to HTTP 409 by teamRoutes).
     */
    async createTeam(name: string, user: User): Promise<Team> {
        const trimmed = name?.trim() ?? "";
        this.logger?.info(`TeamService: Creating team with name: ${trimmed} for user: ${user.id}`);
        if (!trimmed) {
            throw new Error("Team name cannot be empty.");
        }
        const existing = await this.teamRepository.findByNameLower(user.id, trimmed);
        if (existing) {
            const err = new Error("Team name already exists.") as Error & { code?: string };
            err.code = "DUPLICATE_TEAM_NAME";
            throw err;
        }
        return this.teamRepository.createTeam(trimmed, user);
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
        const trimmed = newName?.trim() ?? "";
        this.logger?.info(`TeamService: Updating team ${teamId} for user: ${userId} to name: ${trimmed}`);
        const team = await this.teamRepository.findTeamByIdAndUser(teamId, userId);
        if (!team) {
            throw new Error("Team not found or you do not have permission to update it.");
        }
        if (!trimmed) {
            throw new Error("Team name cannot be empty.");
        }
        // Case-insensitive per-user uniqueness (see createTeam note re: DB migration).
        const existing = await this.teamRepository.findByNameLower(userId, trimmed);
        if (existing && existing.id !== teamId) {
            const err = new Error("Team name already exists.") as Error & { code?: string };
            err.code = "DUPLICATE_TEAM_NAME";
            throw err;
        }
        return this.teamRepository.updateTeam(team, trimmed);
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
