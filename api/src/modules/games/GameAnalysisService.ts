import { DataSource } from "typeorm";
import { 
    GameEventRepository, TeamRepository, PlayerRepository, 
    GamePlayerStatsRepository, Game, Team, Player, GamePlayerStats,
    GeminiProvider, GameRepository
} from "@statvision/common";
import logger from "../../config/logger";

export class GameAnalysisService {
    private gameEventRepository: GameEventRepository;
    private teamRepository: TeamRepository;
    private playerRepository: PlayerRepository;
    private gamePlayerStatsRepository: GamePlayerStatsRepository;
    private gameRepository: GameRepository;

    constructor(private dataSource: DataSource, private aiProvider?: GeminiProvider) {
        this.gameEventRepository = new GameEventRepository(dataSource);
        this.teamRepository = new TeamRepository(dataSource.getRepository(Team));
        this.playerRepository = new PlayerRepository(dataSource);
        this.gamePlayerStatsRepository = new GamePlayerStatsRepository(dataSource);
        this.gameRepository = new GameRepository(dataSource);
    }

    async generateCoachReport(gameId: string, teamId: string): Promise<string> {
        logger.info(`GameAnalysisService: Generating coach report for game ${gameId}, team ${teamId}`);

        if (!this.aiProvider) throw new Error("AI Provider not configured in GameAnalysisService.");

        const game = await this.gameRepository.findOneById(gameId);
        if (!game) throw new Error("Game not found.");

        const team = await this.teamRepository.findOneById(teamId);
        if (!team) throw new Error("Team not found.");

        const events = await this.gameEventRepository.findByGameId(gameId);
        const stats = await this.gamePlayerStatsRepository.findByGameId(gameId);

        // Filter events for the requested team
        const teamEvents = events.filter(e => e.assignedTeamId === teamId);
        const teamStats = stats.filter(s => s.teamId === teamId);

        const eventsJson = JSON.stringify(teamEvents.map(e => ({
            type: e.eventType,
            time: e.absoluteTimestamp,
            actor: e.identifiedJerseyNumber ? `Player #${e.identifiedJerseyNumber}` : 'Unknown',
            outcome: e.isSuccessful ? 'Success' : 'Miss/Fail'
        })).slice(0, 100), null, 2); // Limit to 100 events for context safety

        const boxScoreJson = JSON.stringify(teamStats.map(s => ({
            player: s.description || `Player #${s.jerseyNumber}`,
            jersey: s.jerseyNumber,
            points: s.points,
            rebounds: (s.offensiveRebounds || 0) + (s.defensiveRebounds || 0),
            assists: s.assists,
            fgPercent: s.fieldGoalsAttempted > 0 ? ((s.fieldGoalsMade / s.fieldGoalsAttempted) * 100).toFixed(1) + '%' : '0%'
        })), null, 2);

        const report = await this.aiProvider.generateCoachReport(
            game.gameType,
            team.name,
            game.identityMode,
            eventsJson,
            boxScoreJson
        );

        return report;
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
