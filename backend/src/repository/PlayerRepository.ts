import logger from "../config/logger";
import { Repository } from "typeorm";
import { Player } from "../Player";
import { Team } from "../Team";

export class PlayerRepository {
    constructor(private playerBaseRepository: Repository<Player>) {}

    async createPlayer(name: string, jerseyNumber: number, team: Team): Promise<Player> {
        logger.info(`PlayerRepository: Creating player ${name} (#${jerseyNumber}) for team ${team.id}`);
        const player = this.playerBaseRepository.create({ name, jerseyNumber, team, teamId: team.id });
        return this.playerBaseRepository.save(player);
    }

    async findPlayersByTeam(teamId: string): Promise<Player[]> {
        logger.info(`PlayerRepository: Finding players for team: ${teamId}`);
        return this.playerBaseRepository.find({ where: { teamId } });
    }

    async findPlayerByIdAndTeam(playerId: string, teamId: string): Promise<Player | null> {
        logger.info(`PlayerRepository: Finding player ${playerId} for team: ${teamId}`);
        return this.playerBaseRepository.findOne({ where: { id: playerId, teamId } });
    }

    async updatePlayer(player: Player, newName: string, newJerseyNumber: number): Promise<Player> {
        logger.info(`PlayerRepository: Updating player ${player.id} to name: ${newName}, jersey: ${newJerseyNumber}`);
        player.name = newName;
        player.jerseyNumber = newJerseyNumber;
        return this.playerBaseRepository.save(player);
    }

    async deletePlayer(playerId: string, teamId: string): Promise<void> {
        logger.info(`PlayerRepository: Deleting player ${playerId} from team: ${teamId}`);
        await this.playerBaseRepository.delete({ id: playerId, teamId });
    }

    async findByTeamAndJerseyNumber(teamId: string, jerseyNumber: number): Promise<Player | null> {
        logger.info(`PlayerRepository: Finding player with jersey ${jerseyNumber} for team: ${teamId}`);
        return this.playerBaseRepository.findOne({ where: { teamId, jerseyNumber } });
    }
}
