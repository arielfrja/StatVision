import { DataSource } from "typeorm";
import { Message } from "@google-cloud/pubsub";
import { GameRepository } from "../repository/GameRepository";
import { GameEventRepository } from "../repository/GameEventRepository";
import { GameStatsService } from "./GameStatsService";
import { GameStatus } from "@statvision/common";
import { GameEvent } from "@statvision/common";
import { TeamRepository } from "../repository/TeamRepository";
import { PlayerRepository } from "../repository/PlayerRepository";
import { Team } from "@statvision/common";
import { Player } from "@statvision/common";
import { GameTeamStats } from "@statvision/common";
import { GamePlayerStats } from "@statvision/common";
import { VideoAnalysisJobStatus } from "@statvision/common";
import { randomUUID } from 'crypto';
import { IEventBus } from "../core/interfaces/IEventBus";

const VIDEO_ANALYSIS_RESULTS_TOPIC_NAME = process.env.VIDEO_ANALYSIS_RESULTS_TOPIC_NAME || 'video-analysis-results';
const VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME = process.env.VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME || 'video-analysis-results-sub';
const CHUNK_ANALYSIS_RESULTS_SUBSCRIPTION_NAME = process.env.CHUNK_ANALYSIS_RESULTS_SUBSCRIPTION_NAME || 'chunk-analysis-results-sub';

interface VideoAnalysisJobResultMessage {
    jobId: string;
    gameId: string;
    userId: string;
    chunkId?: string;
    status: VideoAnalysisJobStatus;
    processedEvents: any[];
    failedChunkInfo: any[] | null;
    identifiedPlayers: any[] | null;
    identifiedTeams: any[] | null;
    isFinalResult?: boolean;
}

import * as winston from 'winston';
import { GameEventStatus } from "@statvision/common";

export class VideoAnalysisResultService {
    private gameRepository: GameRepository;
    private gameEventRepository: GameEventRepository;
    private gameStatsService: GameStatsService;
    private eventBus: IEventBus;
    private logger: winston.Logger; // Add a private logger property
    private teamRepository: TeamRepository; // New property
    private playerRepository: PlayerRepository; // New property

    constructor(
        dataSource: DataSource, 
        logger: winston.Logger,
        gameStatsService: GameStatsService,
        eventBus: IEventBus
    ) { 
        this.gameRepository = new GameRepository(dataSource);
        this.gameEventRepository = new GameEventRepository(dataSource);
        this.teamRepository = new TeamRepository(dataSource.getRepository(Team));
        this.playerRepository = new PlayerRepository(dataSource);
        this.logger = logger;
        this.gameStatsService = gameStatsService;
        this.eventBus = eventBus;
    }

    public async startConsumingResults(): Promise<void> {
        this.logger.info("VideoAnalysisResultService: Initializing Pub/Sub consumers...", { phase: 'results_processing' });
        
        // 1. Final Job Results
        await this.eventBus.subscribe(VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME, async (result: VideoAnalysisJobResultMessage, message: Message) => {
            this.logger.info(`Received final job result message ${message.id} for job ${result.jobId}`, { phase: 'results_processing' });
            try {
                await this.processFinalResult(result);
                message.ack();
            } catch (error) {
                this.logger.error(`Error processing final job result:`, { error, phase: 'results_processing' });
                message.nack();
            }
        });

        // 2. Individual Chunk Results (Live Stream)
        await this.eventBus.subscribe(CHUNK_ANALYSIS_RESULTS_SUBSCRIPTION_NAME, async (result: VideoAnalysisJobResultMessage, message: Message) => {
            this.logger.info(`Received live chunk result for chunk ${result.chunkId} of job ${result.jobId}`, { phase: 'results_processing' });
            try {
                await this.processChunkResult(result);
                message.ack();
            } catch (error) {
                this.logger.error(`Error processing live chunk result:`, { error, phase: 'results_processing' });
                message.nack();
            }
        });

        this.logger.info(`VideoAnalysisResultService: Consumers started for results and live streams.`, { phase: 'results_processing' });
    }

    private async processChunkResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        this.logger.info(`Streaming draft results for Game ID: ${result.gameId}, Chunk: ${result.chunkId}`, { phase: 'results_processing' });
        
        // 1. Persist Entities (Teams/Players) - they are always persisted as temp if new
        await this.persistIdentifiedEntities(result);

        // 2. Resolve Player IDs via heuristics (jersey mapping)
        const resolvedEvents = await this.resolvePlayerIds(result.gameId, result.processedEvents);

        // 3. Insert Events as DRAFT
        if (resolvedEvents && resolvedEvents.length > 0) {
            const gameEventsToInsert = resolvedEvents.map(eventData => {
                const gameEvent = new GameEvent();
                Object.assign(gameEvent, eventData);
                gameEvent.gameId = result.gameId;
                gameEvent.chunkId = result.chunkId || null;
                gameEvent.status = GameEventStatus.DRAFT;
                return gameEvent;
            });
            await this.gameEventRepository.batchInsert(gameEventsToInsert);
            this.logger.info(`Successfully streamed ${gameEventsToInsert.length} draft events (with heuristic resolution) for game ${result.gameId}.`, { phase: 'results_processing' });
        }
    }

    /**
     * Attempts to resolve temporary player IDs to real player IDs based on jersey numbers
     * and the game's date/teams.
     */
    private async resolvePlayerIds(gameId: string, events: any[]): Promise<any[]> {
        if (!events || events.length === 0) return events;

        const game = await this.gameRepository.findOneById(gameId);
        if (!game) return events;

        const gameDate = game.gameDate || new Date();
        const resolvedEvents = [];

        // Simple cache to avoid redundant lookups within the same chunk
        const resolutionCache = new Map<string, string>();

        for (const event of events) {
            const teamId = event.assignedTeamId;
            const jerseyNumber = event.identifiedJerseyNumber;

            // Only attempt resolution if we have both team and jersey number
            if (teamId && jerseyNumber) {
                const cacheKey = `${teamId}-${jerseyNumber}`;
                if (resolutionCache.has(cacheKey)) {
                    event.assignedPlayerId = resolutionCache.get(cacheKey);
                } else {
                    try {
                        const history = await this.playerRepository.findPlayerByJerseyAndTeam(
                            teamId, 
                            Number(jerseyNumber), 
                            gameDate
                        );
                        if (history) {
                            event.assignedPlayerId = history.playerId;
                            resolutionCache.set(cacheKey, history.playerId);
                            this.logger.debug(`[HeuristicResolution] Resolved ${cacheKey} -> ${history.playerId}`, { phase: 'results_processing' });
                        }
                    } catch (err) {
                        this.logger.warn(`[HeuristicResolution] Error resolving player for ${cacheKey}`, { error: err, phase: 'results_processing' });
                    }
                }
            }
            resolvedEvents.push(event);
        }
        return resolvedEvents;
    }

    private async processFinalResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        this.logger.info(`Finalizing analysis for Game ID: ${result.gameId}`, { phase: 'results_processing' });

        let gameStatusToUpdate: GameStatus;
        if (result.status === VideoAnalysisJobStatus.COMPLETED) {
            gameStatusToUpdate = GameStatus.ANALYZED;
        } else if (result.status === VideoAnalysisJobStatus.RETRYABLE_FAILED) {
            gameStatusToUpdate = GameStatus.ANALYSIS_FAILED_RETRYABLE;
        } else {
            gameStatusToUpdate = GameStatus.FAILED;
        }

        // 1. Update Game Status
        await this.gameRepository.updateStatus(result.gameId, gameStatusToUpdate, result.failedChunkInfo);

        // 2. If completed, perform final stats recalculation
        if (gameStatusToUpdate === GameStatus.ANALYZED) {
            await this.persistIdentifiedEntities(result); // Catch any remaining entities
            await this.gameStatsService.calculateAndStoreStats(result.gameId);
            this.logger.info(`Successfully finalized game ${result.gameId} and calculated final stats.`, { phase: 'results_processing' });
        }
    }

    private async persistIdentifiedEntities(result: VideoAnalysisJobResultMessage): Promise<void> {
        // Persist Teams
        if (result.identifiedTeams && result.identifiedTeams.length > 0) {
            for (const teamData of result.identifiedTeams) {
                let team = await this.teamRepository.findOneById(teamData.id);
                if (!team) {
                    team = new Team();
                    team.id = teamData.id;
                    const teamLabel = teamData.type === 'HOME' ? 'Home Team' : teamData.type === 'AWAY' ? 'Away Team' : 'Team';
                    const colorLabel = teamData.color ? ` (${teamData.color})` : '';
                    team.name = `${teamLabel}${colorLabel}`;
                    team.isTemp = true;
                    team.userId = result.userId;
                    await this.teamRepository.save(team);
                }

                const gameTeamStats = (await this.gameStatsService.getGameTeamStats(result.gameId, teamData.id)) || new GameTeamStats();
                gameTeamStats.gameId = result.gameId;
                gameTeamStats.teamId = teamData.id;
                gameTeamStats.type = teamData.type;
                gameTeamStats.color = teamData.color;
                gameTeamStats.description = teamData.description;
                await this.gameStatsService.saveGameTeamStats(gameTeamStats);
            }
        }

        // Persist Players
        if (result.identifiedPlayers && result.identifiedPlayers.length > 0) {
            for (const playerData of result.identifiedPlayers) {
                let player = await this.playerRepository.findOneById(playerData.id);
                if (!player) {
                    player = new Player();
                    player.id = playerData.id;
                    const jerseyLabel = playerData.jerseyNumber ? ` #${playerData.jerseyNumber}` : '';
                    player.name = `Player${jerseyLabel}`;
                    player.isTemp = true;
                    await this.playerRepository.save(player);
                }

                const gamePlayerStats = (await this.gameStatsService.getGamePlayerStats(result.gameId, playerData.id)) || new GamePlayerStats();
                gamePlayerStats.gameId = result.gameId;
                gamePlayerStats.playerId = playerData.id;
                gamePlayerStats.teamId = playerData.teamId;
                gamePlayerStats.jerseyNumber = playerData.jerseyNumber;
                gamePlayerStats.description = playerData.description;
                await this.gameStatsService.saveGamePlayerStats(gamePlayerStats);
            }
        }
    }
}
