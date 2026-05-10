import { DataSource } from "typeorm";
import { 
    GameEventRepository, TeamRepository, PlayerRepository, 
    GamePlayerStatsRepository, Game, Team, Player, GamePlayerStats 
} from "@statvision/common";
import logger from "../../config/logger";

export class GameAnalysisService {
    private gameEventRepository: GameEventRepository;
    private teamRepository: TeamRepository;
    private playerRepository: PlayerRepository;
    private gamePlayerStatsRepository: GamePlayerStatsRepository;

    constructor(dataSource: DataSource) {
        this.gameEventRepository = new GameEventRepository(dataSource);
        this.teamRepository = new TeamRepository(dataSource.getRepository(Team));
        this.playerRepository = new PlayerRepository(dataSource);
        this.gamePlayerStatsRepository = new GamePlayerStatsRepository(dataSource);
    }

    async getIdentifiedEntities(gameId: string): Promise<any> {
        logger.info(`GameAnalysisService: Getting identified entities for game ${gameId}`);

        const { teamIds } = await this.gameEventRepository.findUniqueEntityIdsByGameId(gameId);
        
        if (teamIds.length === 0) return [];

        const teams = await this.teamRepository.findByIds(teamIds);
        const playerStatsForGame = await this.gamePlayerStatsRepository.findByGameId(gameId);

        // Map stats by playerId for quick lookup
        const statsMap = new Map(playerStatsForGame.map((ps: GamePlayerStats) => [ps.playerId, { jerseyNumber: ps.jerseyNumber, description: ps.description }]));

        const teamsWithPlayers = await Promise.all(teams.map(async (team: Team) => {
            const playerIds = await this.gameEventRepository.findUniquePlayerIdsByGameAndTeam(gameId, team.id);
            const players = await this.playerRepository.findByIds(playerIds);

            const enrichedPlayers = players.map((player: Player) => {
                const stats: any = statsMap.get(player.id) || {};
                return {
                    ...player,
                    jerseyNumber: stats.jerseyNumber ?? null,
                    description: stats.description ?? null,
                };
            });

            return { ...team, players: enrichedPlayers };
        }));

        logger.info(`GameAnalysisService: Found ${teamsWithPlayers.length} unique teams with their identified players for game ${gameId}.`);

        return teamsWithPlayers;
    }
}
