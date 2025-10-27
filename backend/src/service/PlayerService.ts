import logger from "../config/logger";
import { PlayerRepository } from "../repository/PlayerRepository";
import { Team } from "../Team";
import { Player } from "../Player";

export class PlayerService {
    constructor(private playerRepository: PlayerRepository) {}

    async createPlayer(name: string, jerseyNumber: number, team: Team): Promise<Player> {
        logger.info(`PlayerService: Creating player ${name} (#${jerseyNumber}) for team ${team.id}`);
        if (!name || name.trim() === "") {
            throw new Error("Player name cannot be empty.");
        }
        if (jerseyNumber <= 0) {
            throw new Error("Jersey number must be positive.");
        }

        const existingPlayer = await this.playerRepository.findByTeamAndJerseyNumber(team.id, jerseyNumber);
        if (existingPlayer) {
            throw new Error(`Player with jersey number ${jerseyNumber} already exists in team ${team.name}.`);
        }

        return this.playerRepository.createPlayer(name, jerseyNumber, team);
    }

    async getPlayersByTeam(teamId: string): Promise<Player[]> {
        logger.info(`PlayerService: Getting players for team: ${teamId}`);
        return this.playerRepository.findPlayersByTeam(teamId);
    }

    async getPlayerByIdAndTeam(playerId: string, teamId: string): Promise<Player | null> {
        logger.info(`PlayerService: Getting player ${playerId} for team: ${teamId}`);
        return this.playerRepository.findPlayerByIdAndTeam(playerId, teamId);
    }

    async updatePlayer(playerId: string, teamId: string, newName: string, newJerseyNumber: number): Promise<Player> {
        logger.info(`PlayerService: Updating player ${playerId} in team ${teamId} to name: ${newName}, jersey: ${newJerseyNumber}`);
        const player = await this.playerRepository.findPlayerByIdAndTeam(playerId, teamId);
        if (!player) {
            throw new Error("Player not found or you do not have permission to update it.");
        }
        if (!newName || newName.trim() === "") {
            throw new Error("Player name cannot be empty.");
        }
        if (newJerseyNumber <= 0) {
            throw new Error("Jersey number must be positive.");
        }

        // Check if new jersey number already exists for another player in the same team
        if (newJerseyNumber !== player.jerseyNumber) {
            const existingPlayerWithNewJersey = await this.playerRepository.findByTeamAndJerseyNumber(teamId, newJerseyNumber);
            if (existingPlayerWithNewJersey) {
                throw new Error(`Player with jersey number ${newJerseyNumber} already exists in this team.`);
            }
        }

        return this.playerRepository.updatePlayer(player, newName, newJerseyNumber);
    }

    async deletePlayer(playerId: string, teamId: string): Promise<void> {
        logger.info(`PlayerService: Deleting player ${playerId} from team: ${teamId}`);
        const player = await this.playerRepository.findPlayerByIdAndTeam(playerId, teamId);
        if (!player) {
            throw new Error("Player not found or you do not have permission to delete it.");
        }
        await this.playerRepository.deletePlayer(playerId, teamId);
    }
}
