import { Repository } from "typeorm";
import { Team } from "../Team";
import { User } from "../User";

export class TeamRepository {
    constructor(private teamBaseRepository: Repository<Team>) {}

    async createTeam(name: string, user: User): Promise<Team> {
        const team = this.teamBaseRepository.create({ name, user, userId: user.id });
        return this.teamBaseRepository.save(team);
    }

    async findTeamsByUser(userId: string): Promise<Team[]> {
        return this.teamBaseRepository.find({ where: { userId } });
    }

    async findTeamByIdAndUser(teamId: string, userId: string): Promise<Team | null> {
        return this.teamBaseRepository.findOne({ where: { id: teamId, userId } });
    }

    async updateTeam(team: Team, newName: string): Promise<Team> {
        team.name = newName;
        return this.teamBaseRepository.save(team);
    }

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        await this.teamBaseRepository.delete({ id: teamId, userId });
    }
}
