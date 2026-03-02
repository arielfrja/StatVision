import { DataSource } from "typeorm";
import { GameEventRepository } from "../../repository/GameEventRepository";
import { TeamRepository } from "../../repository/TeamRepository";
import { PlayerRepository } from "../../repository/PlayerRepository";
import { GamePlayerStatsRepository } from "../../repository/GamePlayerStatsRepository";
import { Team } from "../../core/entities/Team";
import logger from "../../config/logger";

export class GameAnalysisService {
    private gameEventRepository: GameEventRepository;
    private teamRepository: TeamRepository;
    private playerRepository: PlayerRepository;
    private playerStatsRepository: GamePlayerStatsRepository;

    constructor(dataSource: DataSource) {
        this.gameEventRepository = new GameEventRepository(dataSource);
        this.teamRepository = new TeamRepository(dataSource.getRepository(Team));
        this.playerRepository = new PlayerRepository(dataSource);
        this.playerStatsRepository = new GamePlayerStatsRepository(dataSource);
    }

    async getIdentifiedEntities(gameId: string): Promise<any[]> {
        logger.info(`GameAnalysisService: Fetching identified entities for game ${gameId}.`);

        // 1. Get all unique team IDs from the game's events
        const { teamIds } = await this.gameEventRepository.findUniqueEntityIdsByGameId(gameId);
        if (teamIds.length === 0) {
            return [];
        }

        // 2. Fetch the full team objects
        const teams = await this.teamRepository.findByIds(teamIds);

        // 3. Fetch all player stats for the game to get jersey numbers and descriptions
        const playerStatsForGame = await this.playerStatsRepository.findByGameId(gameId);
        const statsMap = new Map(playerStatsForGame.map(ps => [ps.playerId, { jerseyNumber: ps.jerseyNumber, description: ps.description }]));

        // 4. For each team, find the unique players and enrich them with stats info
        const teamsWithPlayers = await Promise.all(teams.map(async (team) => {
            const playerIds = await this.gameEventRepository.findUniquePlayerIdsByGameAndTeam(gameId, team.id);
            const players = playerIds.length > 0 ? await this.playerRepository.findByIds(playerIds) : [];
            
            const enrichedPlayers = players.map(player => {
                const stats = statsMap.get(player.id);
                return {
                    ...player,
                    jerseyNumber: stats?.jerseyNumber ?? null,
                    description: stats?.description ?? null,
                };
            });

            return { ...team, players: enrichedPlayers };
        }));

        logger.info(`GameAnalysisService: Found ${teamsWithPlayers.length} unique teams with their identified players for game ${gameId}.`);

        return teamsWithPlayers;
    }
}
