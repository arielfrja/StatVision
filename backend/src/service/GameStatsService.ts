import { Repository } from "typeorm";
import { GameTeamStats } from "../GameTeamStats";
import { GamePlayerStats } from "../GamePlayerStats";
import { GameEvent } from "../GameEvent";
import { GameTeamStatsRepository } from "../repository/GameTeamStatsRepository";
import { GamePlayerStatsRepository } from "../repository/GamePlayerStatsRepository";
import { IGameRepository } from "../repository/IGameRepository";
import logger from "../config/logger";

// Helper interface for aggregation
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
    points: 0,
    assists: 0,
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
};

export class GameStatsService {
    private gameRepository: IGameRepository;
    private teamStatsRepository: GameTeamStatsRepository;
    private playerStatsRepository: GamePlayerStatsRepository;

    constructor(
        gameRepository: IGameRepository,
        teamStatsRepository: GameTeamStatsRepository,
        playerStatsRepository: GamePlayerStatsRepository
    ) {
        this.gameRepository = gameRepository;
        this.teamStatsRepository = teamStatsRepository;
        this.playerStatsRepository = playerStatsRepository;
    }

    private calculateEfficiency(stats: AggregatedStats) {
        const { fieldGoalsMade, fieldGoalsAttempted, threePointersMade, freeThrowsMade, freeThrowsAttempted } = stats;

        // eFG% = (FG + 0.5 * 3P) / FGA
        const effectiveFieldGoalPercentage = fieldGoalsAttempted > 0
            ? (fieldGoalsMade + 0.5 * threePointersMade) / fieldGoalsAttempted
            : 0;

        // TS% = PTS / (2 * (FGA + 0.44 * FTA))
        const trueShootingAttempt = fieldGoalsAttempted + 0.44 * freeThrowsAttempted;
        const trueShootingPercentage = trueShootingAttempt > 0
            ? stats.points / (2 * trueShootingAttempt)
            : 0;

        return { effectiveFieldGoalPercentage, trueShootingPercentage };
    }

    /**
     * Implements BE-305.1: Calculates and stores derived stats (Box Score).
     * Adheres to the Statistical Flexibility Constraint by defaulting missing data to 0.
     * @param gameId The ID of the game to process.
     */
    async calculateAndStoreStats(gameId: string): Promise<void> {
        logger.info(`GameStatsService: Starting detailed stats calculation for game ${gameId}.`);

        // 1. Fetch Game with all events
        const game = await this.gameRepository.findOneWithDetailsInternal(gameId);

        if (!game) {
            logger.error(`GameStatsService: Game ${gameId} not found for stats calculation.`);
            return;
        }

        // 2. Initialize Aggregators
        const teamStatsMap = new Map<string, AggregatedStats>();
        const playerStatsMap = new Map<string, AggregatedStats>();
        
        const events = game.events || [];

        // Identify all unique teams and players involved
        const uniqueTeamIds = new Set<string>();
        const uniquePlayerIds = new Set<string>();
        events.forEach(event => {
            if (event.assignedTeamId) uniqueTeamIds.add(event.assignedTeamId);
            if (event.assignedPlayerId) uniquePlayerIds.add(event.assignedPlayerId);
        });

        uniqueTeamIds.forEach(id => teamStatsMap.set(id, { ...initialStats }));
        uniquePlayerIds.forEach(id => playerStatsMap.set(id, { ...initialStats }));

        // 3. Aggregate Stats from Events
        for (const event of events) {
            const teamId = event.assignedTeamId;
            const playerId = event.assignedPlayerId;

            const teamStats = teamId ? teamStatsMap.get(teamId) : null;
            const playerStats = playerId ? playerStatsMap.get(playerId) : null;

            if (!teamStats) continue; // Must have a team to aggregate team stats

            // Helper function to update stats for both team and player
            const updateStats = (stats: AggregatedStats) => {
                if (event.eventType === 'Shot') {
                    const points = event.eventDetails?.points || 0;
                    const isMade = event.isSuccessful;
                    const isThree = event.eventDetails?.isThree || false;

                    stats.fieldGoalsAttempted += 1;
                    if (isMade) {
                        stats.fieldGoalsMade += 1;
                        stats.points += points;
                    }

                    if (isThree) {
                        stats.threePointersAttempted += 1;
                        if (isMade) {
                            stats.threePointersMade += 1;
                        }
                    }
                } else if (event.eventType === 'FreeThrow') {
                    const isMade = event.isSuccessful;
                    stats.freeThrowsAttempted += 1;
                    if (isMade) {
                        stats.freeThrowsMade += 1;
                        stats.points += 1;
                    }
                } else if (event.eventType === 'Rebound') {
                    const isOffensive = event.eventDetails?.isOffensive || false;
                    if (isOffensive) {
                        stats.offensiveRebounds += 1;
                    } else {
                        stats.defensiveRebounds += 1;
                    }
                } else if (event.eventType === 'Assist') {
                    stats.assists += 1;
                } else if (event.eventType === 'Steal') {
                    stats.steals += 1;
                } else if (event.eventType === 'Block') {
                    stats.blocks += 1;
                } else if (event.eventType === 'Turnover') {
                    stats.turnovers += 1;
                } else if (event.eventType === 'Foul') {
                    stats.fouls += 1;
                }
            };

            // Update Team Stats
            updateStats(teamStats);

            // Update Player Stats (if player is assigned)
            if (playerStats) {
                updateStats(playerStats);
            }
        }

        // 4. Store Team Stats
        const teamStatsEntities = Array.from(teamStatsMap.entries()).map(([teamId, stats]) => {
            const { effectiveFieldGoalPercentage, trueShootingPercentage } = this.calculateEfficiency(stats);
            
            return this.teamStatsRepository.create({
                gameId: gameId,
                teamId: teamId,
                ...stats,
                effectiveFieldGoalPercentage,
                trueShootingPercentage,
            });
        });
        await this.teamStatsRepository.save(teamStatsEntities);

        // 5. Store Player Stats
        const playerStatsEntities = Array.from(playerStatsMap.entries()).map(([playerId, stats]) => {
            const { effectiveFieldGoalPercentage, trueShootingPercentage } = this.calculateEfficiency(stats);
            
            // NOTE: minutesPlayed and plusMinus require complex lineup tracking, which is outside the scope of this MVP iteration.
            // They are defaulted to 0 for now, adhering to the Statistical Flexibility Constraint.
            return this.playerStatsRepository.create({
                gameId: gameId,
                playerId: playerId,
                ...stats,
                minutesPlayed: 0, 
                plusMinus: 0,
                effectiveFieldGoalPercentage,
                trueShootingPercentage,
            });
        });
        await this.playerStatsRepository.save(playerStatsEntities);

        logger.info(`GameStatsService: Detailed stats calculation and storage complete for game ${gameId}.`);
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
