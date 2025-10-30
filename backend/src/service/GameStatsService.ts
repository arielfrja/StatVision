import { Repository } from "typeorm";
import { GameTeamStats } from "../GameTeamStats";
import { GamePlayerStats } from "../GamePlayerStats";
import { GameEvent } from "../GameEvent";
import { GameTeamStatsRepository } from "../repository/GameTeamStatsRepository";
import { GamePlayerStatsRepository } from "../repository/GamePlayerStatsRepository";
import { IGameRepository } from "../repository/IGameRepository";
import logger from "../config/logger";

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

    /**
     * Implements BE-305.1: Calculates and stores derived stats (Box Score).
     * @param gameId The ID of the game to process.
     */
    async calculateAndStoreStats(gameId: string): Promise<void> {
        logger.info(`GameStatsService: Starting stats calculation for game ${gameId}.`);

        // 1. Fetch Game with all events
        const game = await this.gameRepository.findOneWithDetailsInternal(gameId);

        if (!game) {
            logger.error(`GameStatsService: Game ${gameId} not found for stats calculation.`);
            return;
        }

        // 2. Initialize Stats Aggregators
        const teamStatsMap = new Map<string, { points: number, rebounds: number, assists: number }>();
        
        // Initialize teams if assigned (required for calculation)
        if (game.assignedTeamAId) teamStatsMap.set(game.assignedTeamAId, { points: 0, rebounds: 0, assists: 0 });
        if (game.assignedTeamBId) teamStatsMap.set(game.assignedTeamBId, { points: 0, rebounds: 0, assists: 0 });

        // 3. Aggregate Stats from Events
        for (const event of game.events) {
            const teamId = event.assignedTeamId;

            if (teamId && teamStatsMap.has(teamId)) {
                const stats = teamStatsMap.get(teamId)!;

                if (event.eventType === 'Shot' && event.eventDetails?.points) {
                    stats.points += event.eventDetails.points;
                }
                if (event.eventType === 'Rebound') {
                    stats.rebounds += 1;
                }
                // Note: Assists logic is complex and requires player mapping, skipping for this MVP structure.
            }
        }

        // 4. Store Team Stats
        const teamStatsEntities = Array.from(teamStatsMap.entries()).map(([teamId, stats]) => {
            return this.teamStatsRepository.create({
                gameId: gameId,
                teamId: teamId,
                points: stats.points,
                rebounds: stats.rebounds,
                assists: stats.assists,
            });
        });
        await this.teamStatsRepository.save(teamStatsEntities);

        // 5. Store Player Stats (Skipping detailed player stats storage for now as it requires complex player ID mapping)
        logger.warn(`GameStatsService: Skipping detailed player stats storage for now (requires player ID mapping).`);

        logger.info(`GameStatsService: Stats calculation and storage complete for game ${gameId}.`);
    }
}