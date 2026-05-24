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
        
        // 1. Clear existing stats to ensure a clean state and prevent constraint violations
        await this.clearStatsForGame(gameId);

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

            const type = event.eventType.toLowerCase();
            const subType = (event.eventSubType || '').toLowerCase();
            const isSuccessful = !!event.isSuccessful;

            const updateStats = (stats: AggregatedStats) => {
                // 1. SHOTS
                if (type.includes('shot') || type.includes('fg')) {
                    const isThree = type.includes('3pt') || type.includes('3-point') || subType.includes('3pt');
                    let points = 0;
                    if (isSuccessful) {
                        points = (pointValueRule === '1_AND_2') ? (isThree ? 2 : 1) : (isThree ? 3 : 2);
                    }

                    stats.fieldGoalsAttempted += 1;
                    if (isSuccessful) {
                        stats.fieldGoalsMade += 1;
                        stats.points += points;
                    }
                    if (isThree) {
                        stats.threePointersAttempted += 1;
                        if (isSuccessful) stats.threePointersMade += 1;
                    }
                } 
                // 2. FREE THROWS
                else if (type.includes('free throw') || type.includes('ft')) {
                    stats.freeThrowsAttempted += 1;
                    if (isSuccessful) {
                        stats.freeThrowsMade += 1;
                        stats.points += 1;
                    }
                } 
                // 3. REBOUNDS
                else if (type.includes('rebound')) {
                    const isOffensive = type.includes('offensive') || subType.includes('offensive') || (event.eventDetails?.isOffensive);
                    if (isOffensive) stats.offensiveRebounds += 1; 
                    else stats.defensiveRebounds += 1;
                } 
                // 4. CORE COUNTABLES
                else if (type.includes('assist')) stats.assists += 1;
                else if (type.includes('steal')) stats.steals += 1;
                else if (type.includes('block')) stats.blocks += 1;
                else if (type.includes('turnover')) stats.turnovers += 1;
                else if (type.includes('foul')) stats.fouls += 1;
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
