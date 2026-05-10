import { GameTeamStats, GamePlayerStats, GameEvent } from "../entities";
import { GameTeamStatsRepository } from "../repositories/GameTeamStatsRepository";
import { GamePlayerStatsRepository } from "../repositories/GamePlayerStatsRepository";
import { IGameRepository } from "../repositories/IGameRepository";
import { ILogger } from "../interfaces/ILogger";

interface AggregatedStats {
    points: number;
    assists: number;
    offensiveRebounds: number;
    defensiveRebounds: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
}

const initialStats: AggregatedStats = {
    points: 0, assists: 0, offensiveRebounds: 0, defensiveRebounds: 0,
    fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0,
    freeThrowsMade: 0, freeThrowsAttempted: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0,
};

export class GameStatsService {
    constructor(
        private gameRepository: IGameRepository,
        private teamStatsRepository: GameTeamStatsRepository,
        private playerStatsRepository: GamePlayerStatsRepository,
        private logger?: ILogger
    ) {}

    private calculateEfficiency(stats: AggregatedStats) {
        const { fieldGoalsMade, fieldGoalsAttempted, threePointersMade, freeThrowsMade, freeThrowsAttempted } = stats;
        const effectiveFieldGoalPercentage = fieldGoalsAttempted > 0
            ? (fieldGoalsMade + 0.5 * threePointersMade) / fieldGoalsAttempted
            : 0;
        const trueShootingAttempt = fieldGoalsAttempted + 0.44 * freeThrowsAttempted;
        const trueShootingPercentage = trueShootingAttempt > 0
            ? stats.points / (2 * trueShootingAttempt)
            : 0;
        return { effectiveFieldGoalPercentage, trueShootingPercentage };
    }

    async clearStatsForGame(gameId: string): Promise<void> {
        this.logger?.info(`GameStatsService: Clearing stats for game ${gameId}.`);
        await this.teamStatsRepository.deleteByGameId(gameId);
        await this.playerStatsRepository.deleteByGameId(gameId);
    }

    async calculateAndStoreStats(gameId: string): Promise<void> {
        this.logger?.info(`GameStatsService: Starting detailed stats calculation for game ${gameId}.`);
        const game = await this.gameRepository.findOneWithDetailsInternal(gameId);
        if (!game) {
            this.logger?.error(`GameStatsService: Game ${gameId} not found for stats calculation.`);
            return;
        }

        const pointValueRule = game.ruleset?.pointValue || '2_AND_3';
        const teamStatsMap = new Map<string, AggregatedStats>();
        const playerStatsMap = new Map<string, AggregatedStats>();
        const events = game.events || [];

        const uniqueTeamIds = new Set<string>();
        const uniquePlayerIds = new Set<string>();
        events.forEach(event => {
            if (event.assignedTeamId) uniqueTeamIds.add(event.assignedTeamId);
            if (event.assignedPlayerId) uniquePlayerIds.add(event.assignedPlayerId);
        });

        uniqueTeamIds.forEach(id => teamStatsMap.set(id, { ...initialStats }));
        uniquePlayerIds.forEach(id => playerStatsMap.set(id, { ...initialStats }));

        for (const event of events) {
            const teamId = event.assignedTeamId;
            const playerId = event.assignedPlayerId;
            const teamStats = teamId ? teamStatsMap.get(teamId) : null;
            const playerStats = playerId ? playerStatsMap.get(playerId) : null;
            if (!teamStats) continue;

            const updateStats = (stats: AggregatedStats) => {
                if (event.eventType === 'Shot') {
                    const isMade = event.isSuccessful;
                    const isThree = event.eventDetails?.isThree || false;
                    let points = 0;
                    if (isMade) points = (pointValueRule === '1_AND_2') ? (isThree ? 2 : 1) : (isThree ? 3 : 2);
                    stats.fieldGoalsAttempted += 1;
                    if (isMade) { stats.fieldGoalsMade += 1; stats.points += points; }
                    if (isThree) { stats.threePointersAttempted += 1; if (isMade) stats.threePointersMade += 1; }
                } else if (event.eventType === 'FreeThrow') {
                    const isMade = event.isSuccessful;
                    stats.freeThrowsAttempted += 1;
                    if (isMade) { stats.freeThrowsMade += 1; stats.points += 1; }
                } else if (event.eventType === 'Rebound') {
                    if (event.eventDetails?.isOffensive) stats.offensiveRebounds += 1; else stats.defensiveRebounds += 1;
                } else if (event.eventType === 'Assist') stats.assists += 1;
                else if (event.eventType === 'Steal') stats.steals += 1;
                else if (event.eventType === 'Block') stats.blocks += 1;
                else if (event.eventType === 'Turnover') stats.turnovers += 1;
                else if (event.eventType === 'Foul') stats.fouls += 1;
            };

            updateStats(teamStats);
            if (playerStats) updateStats(playerStats);
        }

        const teamStatsEntities = Array.from(teamStatsMap.entries()).map(([teamId, stats]) => {
            const { effectiveFieldGoalPercentage, trueShootingPercentage } = this.calculateEfficiency(stats);
            return this.teamStatsRepository.create({
                gameId, teamId, ...stats, effectiveFieldGoalPercentage, trueShootingPercentage,
            });
        });
        await this.teamStatsRepository.save(teamStatsEntities);

        const playerStatsEntities = Array.from(playerStatsMap.entries()).map(([playerId, stats]) => {
            const { effectiveFieldGoalPercentage, trueShootingPercentage } = this.calculateEfficiency(stats);
            return this.playerStatsRepository.create({
                gameId, playerId, ...stats, minutesPlayed: 0, plusMinus: 0, effectiveFieldGoalPercentage, trueShootingPercentage,
            });
        });
        await this.playerStatsRepository.save(playerStatsEntities);

        this.logger?.info(`GameStatsService: Detailed stats calculation and storage complete for game ${gameId}.`);
    }

    async getGameTeamStats(gameId: string, teamId: string): Promise<GameTeamStats | null> {
        return this.teamStatsRepository.findOneByGameAndTeam(gameId, teamId);
    }

    async saveGameTeamStats(gameTeamStats: GameTeamStats): Promise<GameTeamStats> {
        return this.teamStatsRepository.save(gameTeamStats) as Promise<GameTeamStats>;
    }

    async getGamePlayerStats(gameId: string, playerId: string): Promise<GamePlayerStats | null> {
        return this.playerStatsRepository.findOneByGameAndPlayer(gameId, playerId);
    }

    async saveGamePlayerStats(gamePlayerStats: GamePlayerStats): Promise<GamePlayerStats> {
        return this.playerStatsRepository.save(gamePlayerStats) as Promise<GamePlayerStats>;
    }
}
