import { Repository } from "typeorm";
import { Player } from "../Player";
import { Team } from "../Team";

export class PlayerRepository {
    constructor(private playerBaseRepository: Repository<Player>) {}

    async createPlayer(name: string, jerseyNumber: number, team: Team): Promise<Player> {
        const player = this.playerBaseRepository.create({ name, jerseyNumber, team, teamId: team.id });
        return this.playerBaseRepository.save(player);
    }

    async findPlayersByTeam(teamId: string): Promise<Player[]> {
        return this.playerBaseRepository.find({ where: { teamId } });
    }

    async findPlayerByIdAndTeam(playerId: string, teamId: string): Promise<Player | null> {
        return this.playerBaseRepository.findOne({ where: { id: playerId, teamId } });
    }

    async updatePlayer(player: Player, newName: string, newJerseyNumber: number): Promise<Player> {
        player.name = newName;
        player.jerseyNumber = newJerseyNumber;
        return this.playerBaseRepository.save(player);
    }

    async deletePlayer(playerId: string, teamId: string): Promise<void> {
        await this.playerBaseRepository.delete({ id: playerId, teamId });
    }

    async findByTeamAndJerseyNumber(teamId: string, jerseyNumber: number): Promise<Player | null> {
        return this.playerBaseRepository.findOne({ where: { teamId, jerseyNumber } });
    }
}
