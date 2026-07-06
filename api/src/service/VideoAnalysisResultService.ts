import { DataSource } from "typeorm";
import { Message } from "@google-cloud/pubsub";
import { 
    GameRepository, GameEventRepository, GameStatsService, 
    TeamRepository, PlayerRepository, 
    GameStatus, GameEvent, Team, Player, GameTeamStats, GamePlayerStats, 
    VideoAnalysisJobStatus, GameEventStatus, IEventBus, PlayerTeamHistory
} from "@statvision/common";
import * as winston from 'winston';
import { NotificationService } from "./NotificationService";
import { CleanupService } from "./CleanupService";

const VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME = process.env.VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME || 'video-analysis-results-sub';
const CHUNK_ANALYSIS_RESULTS_SUBSCRIPTION_NAME = process.env.CHUNK_ANALYSIS_RESULTS_SUBSCRIPTION_NAME || 'chunk-analysis-results-sub';

export interface VideoAnalysisJobResultMessage {
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

export class VideoAnalysisResultService {
    private gameRepository: GameRepository;
    private gameEventRepository: GameEventRepository;
    private gameStatsService: GameStatsService;
    private eventBus: IEventBus;
    private logger: winston.Logger; 
    private teamRepository: TeamRepository; 
    private playerRepository: PlayerRepository; 

    constructor(
        private dataSource: DataSource, 
        logger: winston.Logger,
        gameStatsService: GameStatsService,
        eventBus: IEventBus,
        private notificationService: NotificationService,
        private cleanupService: CleanupService
    ) { 
        this.gameRepository = new GameRepository(dataSource);
        this.gameEventRepository = new GameEventRepository(dataSource);
        this.teamRepository = new TeamRepository(dataSource.getRepository(Team));
        this.playerRepository = new PlayerRepository(dataSource);
        this.logger = logger;
        this.gameStatsService = gameStatsService;
        this.eventBus = eventBus;
    }

    /**
     * @deprecated Use handlePushMessage() for production push-based architecture.
     * This method is kept for local development/legacy support but should not be called in Cloud Run.
     */
    public async startConsumingResults(): Promise<void> {
        this.logger.info("VideoAnalysisResultService: Initializing Pub/Sub consumers (Legacy PULL mode)...", { phase: 'results_processing' });
        
        await this.eventBus.subscribe(VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME, async (result: VideoAnalysisJobResultMessage, message: Message) => {
            this.logger.info(`Received final job result message ${message.id} for job ${result.jobId}`, { phase: 'results_processing' });
            try {
                await this.processFinalResult(result);
                if (message.ack) message.ack();
            } catch (error) {
                this.logger.error(`Error processing final job result:`, { error, phase: 'results_processing' });
                if (message.nack) message.nack();
            }
        });

        await this.eventBus.subscribe(CHUNK_ANALYSIS_RESULTS_SUBSCRIPTION_NAME, async (result: VideoAnalysisJobResultMessage, message: Message) => {
            this.logger.info(`Received live chunk result for chunk ${result.chunkId} of job ${result.jobId}`, { phase: 'results_processing' });
            try {
                await this.processChunkResult(result);
                if (message.ack) message.ack();
            } catch (error: any) {
                this.logger.error(`Error processing live chunk result for game ${result.gameId}: ${error.message}`, { 
                    stack: error.stack,
                    phase: 'results_processing' 
                });
                if (message.nack) message.nack();
            }
        });
    }

    /**
     * Entry point for Pub/Sub Push Webhooks (Production mode).
     */
    public async handlePushMessage(message: VideoAnalysisJobResultMessage): Promise<void> {
        this.logger.info(`[VideoAnalysisResultService] Handling push message for job ${message.jobId}`, { 
            phase: 'results_processing',
            isFinal: message.isFinalResult || !message.chunkId 
        });

        try {
            if (message.isFinalResult || !message.chunkId) {
                await this.processFinalResult(message);
            } else {
                await this.processChunkResult(message);
            }
        } catch (error: any) {
            this.logger.error(`[VideoAnalysisResultService] Failed to process push message: ${error.message}`, { 
                jobId: message.jobId,
                error: error.stack
            });
            
            // Inform user of the failure via Firebase
            await this.notificationService.updateJobProgress(message.jobId, {
                progress: 0,
                status: 'FAILED',
                details: `Internal error: ${error.message}`,
                gameId: message.gameId
            });

            throw error; // Rethrow so the webhook returns 500 and triggers retry
        }
    }

    private async processChunkResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        this.logger.info(`Streaming draft results for Game ID: ${result.gameId}, Chunk: ${result.chunkId}`, { phase: 'results_processing' });
        
        try {
            await this.persistIdentifiedEntities(result);
        } catch (err: any) {
            this.logger.error(`Error in persistIdentifiedEntities: ${err.message}`, { stack: err.stack });
            throw err;
        }

        let resolvedEvents;
        try {
            resolvedEvents = await this.resolvePlayerIds(result.gameId, result.processedEvents);
        } catch (err: any) {
            this.logger.error(`Error in resolvePlayerIds: ${err.message}`, { stack: err.stack });
            throw err;
        }

        if (resolvedEvents && resolvedEvents.length > 0) {
            const gameEventsToInsert = resolvedEvents.map(eventData => {
                const gameEvent = new GameEvent();
                Object.assign(gameEvent, eventData);
                gameEvent.gameId = result.gameId;
                gameEvent.chunkId = result.chunkId || null;
                gameEvent.status = GameEventStatus.DRAFT;

                if (!this.isUuid(gameEvent.assignedTeamId)) gameEvent.assignedTeamId = null;
                if (!this.isUuid(gameEvent.assignedPlayerId)) gameEvent.assignedPlayerId = null;
                if (gameEvent.isSuccessful === null || gameEvent.isSuccessful === undefined) gameEvent.isSuccessful = false;

                return gameEvent;
            });

            try {
                await this.gameEventRepository.batchInsert(gameEventsToInsert);
                this.logger.info(`Successfully streamed ${gameEventsToInsert.length} draft events for game ${result.gameId}.`, { phase: 'results_processing' });
            } catch (err: any) {
                this.logger.error(`Error in batchInsert: ${err.message}`, { stack: err.stack });
                throw err;
            }
        }
    }

    private isUuid(id: string | null | undefined): boolean {
        if (!id) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    private async resolvePlayerIds(gameId: string, events: any[]): Promise<any[]> {
        if (!events || events.length === 0) return events;
        
        const game = await this.gameRepository.findOneById(gameId);
        if (!game) return events;
        
        const gameDate = game.gameDate || new Date();
        const resolvedEvents = [];
        const resolutionCache = new Map<string, string>();

        for (const event of events) {
            if (event.assignedPlayerId && this.isUuid(event.assignedPlayerId)) {
                resolvedEvents.push(event);
                continue;
            }

            let teamId = event.assignedTeamId;
            const jerseyNumber = event.identifiedJerseyNumber;

            if (teamId === 'TEMP_TEAM_1' && game.homeTeamId) teamId = game.homeTeamId;
            else if (teamId === 'TEMP_TEAM_2' && game.awayTeamId) teamId = game.awayTeamId;

            if (teamId && jerseyNumber && this.isUuid(teamId)) {
                const cacheKey = `${teamId}-${jerseyNumber}`;
                if (resolutionCache.has(cacheKey)) {
                    event.assignedPlayerId = resolutionCache.get(cacheKey);
                } else {
                    try {
                        const history = await this.playerRepository.findPlayerByJerseyAndTeam(teamId, Number(jerseyNumber), gameDate);
                        if (history) {
                            event.assignedPlayerId = history.playerId;
                            resolutionCache.set(cacheKey, history.playerId);
                        }
                    } catch (err) {
                        this.logger.warn(`[HeuristicResolution] Error resolving player for ${cacheKey}`, { error: err });
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
        let firebaseStatus = 'COMPLETED';

        if (result.status === VideoAnalysisJobStatus.COMPLETED) {
            gameStatusToUpdate = GameStatus.ANALYZED;
            firebaseStatus = 'ANALYZED';
        } else if (result.status === VideoAnalysisJobStatus.RETRYABLE_FAILED) {
            gameStatusToUpdate = GameStatus.ANALYSIS_FAILED_RETRYABLE;
            firebaseStatus = 'FAILED_RETRYABLE';
        } else {
            gameStatusToUpdate = GameStatus.FAILED;
            firebaseStatus = 'FAILED';
        }

        await this.gameRepository.updateStatus(result.gameId, gameStatusToUpdate, result.failedChunkInfo);

        if (gameStatusToUpdate === GameStatus.ANALYZED) {
            await this.persistIdentifiedEntities(result);
            await this.gameStatsService.calculateAndStoreStats(result.gameId);
        }

        // 1. Sync final status to Firebase
        await this.notificationService.updateJobProgress(result.jobId, {
            progress: 100,
            status: firebaseStatus,
            gameId: result.gameId
        });

        // 2. Cleanup GCS artifacts (zombie chunks)
        await this.cleanupService.cleanupJobArtifacts(result.jobId);

        // 3. Notify user via Push Notification
        const title = gameStatusToUpdate === GameStatus.ANALYZED ? 'Game Analyzed!' : 'Analysis Failed';
        const body = gameStatusToUpdate === GameStatus.ANALYZED 
            ? `Your game analysis for ${result.gameId} is complete.`
            : `Analysis for game ${result.gameId} failed. Please check the dashboard.`;

        await this.notificationService.sendUserUpdate(result.userId, title, body, {
            gameId: result.gameId,
            jobId: result.jobId,
            status: firebaseStatus
        });
    }

    private async persistIdentifiedEntities(result: VideoAnalysisJobResultMessage): Promise<void> {
        if (result.identifiedTeams && result.identifiedTeams.length > 0) {
            for (const teamData of result.identifiedTeams) {
                if (!this.isUuid(teamData.id)) continue; 

                let team = await this.teamRepository.findOneById(teamData.id);
                if (!team) {
                    team = new Team();
                    team.id = teamData.id;
                    team.name = teamData.name || `${teamData.type === 'HOME' ? 'Home' : 'Away'} Team${teamData.color ? ' ('+teamData.color+')' : ''}`;
                    team.isTemp = true;
                    team.userId = result.userId;
                    await this.teamRepository.save(team);
                }

                const { id: _, ...statsToMerge } = teamData;
                const gameTeamStats = (await this.gameStatsService.getGameTeamStats(result.gameId, teamData.id)) || new GameTeamStats();
                Object.assign(gameTeamStats, { gameId: result.gameId, teamId: teamData.id, ...statsToMerge });
                await this.gameStatsService.saveGameTeamStats(gameTeamStats);
            }
        }

        if (result.identifiedPlayers && result.identifiedPlayers.length > 0) {
            for (const playerData of result.identifiedPlayers) {
                if (!this.isUuid(playerData.id)) continue;

                let player = await this.playerRepository.findOneById(playerData.id);
                if (!player) {
                    player = new Player();
                    player.id = playerData.id;
                    player.name = playerData.name || `Player${playerData.jerseyNumber ? ' #'+playerData.jerseyNumber : ''}`;
                    player.isTemp = true;
                    await this.playerRepository.save(player);
                }

                if (playerData.teamId && this.isUuid(playerData.teamId)) {
                    try {
                        const history = await this.playerRepository.findPlayerByJerseyAndTeam(
                            playerData.teamId, 
                            playerData.jerseyNumber, 
                            new Date()
                        );
                        if (!history) {
                            const newHistory = new PlayerTeamHistory();
                            newHistory.playerId = player.id;
                            newHistory.teamId = playerData.teamId;
                            newHistory.jerseyNumber = playerData.jerseyNumber;
                            newHistory.startDate = new Date();
                            await this.dataSource.getRepository(PlayerTeamHistory).save(newHistory);
                        }
                    } catch (err) {
                        this.logger.warn(`Failed to save player history during persistence`, { error: err });
                    }
                }

                const { id: _, ...statsToMerge } = playerData;
                const gamePlayerStats = (await this.gameStatsService.getGamePlayerStats(result.gameId, playerData.id)) || new GamePlayerStats();
                Object.assign(gamePlayerStats, { gameId: result.gameId, playerId: playerData.id, ...statsToMerge });
                await this.gameStatsService.saveGamePlayerStats(gamePlayerStats);
            }
        }
    }
}
