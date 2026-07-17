import { DataSource, In } from "typeorm";
import { Message } from "@google-cloud/pubsub";
import { 
    GameRepository, GameEventRepository, GameStatsService, 
    TeamRepository, PlayerRepository, 
    GameStatus, GameEvent, Team, Player, GameTeamStats, GamePlayerStats, 
    VideoAnalysisJobStatus, GameEventStatus, IEventBus, Game
} from "@statvision/common";
import * as winston from 'winston';
import { v5 as uuidv5, validate as validateUuid } from 'uuid';

const VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME = process.env.VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME || 'video-analysis-results-sub';
const CHUNK_ANALYSIS_RESULTS_SUBSCRIPTION_NAME = process.env.CHUNK_ANALYSIS_RESULTS_SUBSCRIPTION_NAME || 'chunk-analysis-results-sub';

// Fixed namespace for deterministic UUID generation (v5)
const STATVISION_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

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

    public async handleChunkResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        await this.processChunkResult(result);
    }

    public async handleFinalResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        await this.processFinalResult(result);
    }

    private async processChunkResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        this.logger.info(`Streaming draft results for Game ID: ${result.gameId}, Chunk: ${result.chunkId}`, { phase: 'results_processing' });
        
        // 1. Persist master lists (creates Temp Team/Player records)
        await this.persistIdentifiedEntities(result);

        // 2. Map AI placeholders and generate deterministic UUIDs
        const resolvedEvents = await this.resolvePlayerIds(result.gameId, result.processedEvents, result.userId);

        if (resolvedEvents && resolvedEvents.length > 0) {
            const gameEventsToUpsert = resolvedEvents.map(eventData => {
                const event = new GameEvent();
                
                // DETERMINISTIC ID: Hash of game + time + type + actor
                // This ensures idempotency across retries.
                const uniqueSeed = `${result.gameId}:${eventData.absoluteTimestamp}:${eventData.eventType}:${eventData.assignedPlayerId || 'TEAM'}`;
                event.id = uuidv5(uniqueSeed, STATVISION_NAMESPACE);

                event.gameId = result.gameId;
                event.chunkId = result.chunkId || null;
                event.status = GameEventStatus.DRAFT;
                
                event.eventType = eventData.eventType;
                event.eventSubType = eventData.eventSubType;
                event.isSuccessful = !!eventData.isSuccessful;
                
                // Sanitized Numeric Fields
                event.period = typeof eventData.period === 'number' ? eventData.period : 1;
                event.timeRemaining = this.parseTime(eventData.timeRemaining || eventData.timestamp);
                event.absoluteTimestamp = this.parseTime(eventData.absoluteTimestamp || eventData.timestamp);
                event.videoClipStartTime = this.parseTime(eventData.videoClipStartTime);
                event.videoClipEndTime = this.parseTime(eventData.videoClipEndTime);
                
                event.xCoord = typeof eventData.xCoord === 'number' ? eventData.xCoord : 0;
                event.yCoord = typeof eventData.yCoord === 'number' ? eventData.yCoord : 0;

                // Resolved IDs (Guaranteed to be UUIDs now)
                event.assignedTeamId = this.isUuid(eventData.assignedTeamId) ? eventData.assignedTeamId : null;
                event.assignedPlayerId = this.isUuid(eventData.assignedPlayerId) ? eventData.assignedPlayerId : null;
                event.relatedEventId = this.isUuid(eventData.relatedEventId) ? eventData.relatedEventId : null;
                
                // Capture the raw AI strings for the manual mapping UI
                event.identifiedTeamColor = eventData.identifiedTeamColor;
                event.identifiedJerseyNumber = typeof eventData.identifiedJerseyNumber === 'number' ? eventData.identifiedJerseyNumber : null;
                
                // Capture all extra AI fields into eventDetails
                const { 
                    eventType, eventSubType, timestamp, isSuccessful, period, xCoord, yCoord, 
                    assignedPlayerId, assignedTeamId, onCourtPlayerIds, identifiedTeamColor, 
                    identifiedJerseyNumber, absoluteTimestamp, videoClipStartTime, videoClipEndTime,
                    playerCertainty, eventTypeCertainty, gameId, chunkId, ...details 
                } = eventData;

                // Persist certainty fields explicitly (clamped to 0-1)
                event.playerCertainty = typeof playerCertainty === 'number'
                    ? Math.min(1, Math.max(0, playerCertainty))
                    : null;
                event.eventTypeCertainty = typeof eventTypeCertainty === 'number'
                    ? Math.min(1, Math.max(0, eventTypeCertainty))
                    : null;
                event.eventDetails = details;

                // NEW: Resolve on-court player IDs
                if (Array.isArray(eventData.onCourtPlayerIds)) {
                    event.onCourtPlayerIds = eventData.onCourtPlayerIds.map((tempId: string) => 
                        this.isUuid(tempId) ? tempId : uuidv5(`${result.gameId}:${tempId}`, STATVISION_NAMESPACE)
                    );
                } else {
                    event.onCourtPlayerIds = [];
                }
                
                return event;
            });

            // Use save() which performs an UPSERT if the primary key (id) matches
            await this.dataSource.getRepository(GameEvent).save(gameEventsToUpsert, { chunk: 100 });
            this.logger.info(`Successfully upserted \${gameEventsToUpsert.length} draft events for game \${result.gameId}.`, { phase: 'results_processing' });
        }
    }

    private isUuid(id: string | null | undefined): boolean {
        if (!id) return false;
        return validateUuid(id);
    }

    private parseTime(time: any): number {
        if (time === null || time === undefined) return 0;
        if (typeof time === 'number') return isNaN(time) ? 0 : time;
        
        if (typeof time === 'string') {
            const cleanTime = time.trim();
            if (cleanTime.includes(':')) {
                const parts = cleanTime.split(':').map(p => parseInt(p, 10));
                if (parts.some(isNaN)) return 0;

                if (parts.length === 2) {
                    return (parts[0] || 0) * 60 + (parts[1] || 0);
                } else if (parts.length === 3) {
                    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
                }
            }
            const parsed = parseFloat(cleanTime);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    public async resolvePlayerIds(gameId: string, events: any[], userId: string): Promise<any[]> {
        if (!events || events.length === 0) return events;
        const game = await this.dataSource.getRepository(Game).findOne({ where: { id: gameId } });
        if (!game) return events;
        const gameDate = game.gameDate || new Date();
        const resolvedEvents = [];
        
        for (const event of events) {
            // --- 1. RESOLVE TEAM PLACEHOLDERS (RAW AI STRINGS) ---
            let teamId = event.assignedTeamId;
            const jerseyNumber = event.identifiedJerseyNumber;
            const color = event.identifiedTeamColor || 'Unknown';

            if (teamId === 'TEMP_TEAM_1' && game.homeTeamId) {
                teamId = game.homeTeamId;
            } else if (teamId === 'TEMP_TEAM_2' && game.awayTeamId) {
                teamId = game.awayTeamId;
            }

            // --- 2. CONVERT REMAINING PLACEHOLDERS TO DETERMINISTIC UUIDs ---
            if (teamId && !this.isUuid(teamId)) {
                teamId = uuidv5(`${gameId}:${teamId}`, STATVISION_NAMESPACE);
            }
            event.assignedTeamId = teamId;

            // --- 3. RESOLVE PLAYER PLACEHOLDERS ---
            let playerId = event.assignedPlayerId;
            
            // Try to find an official player if we have a team and jersey
            if (this.isUuid(teamId) && jerseyNumber) {
                try {
                    const history = await this.playerRepository.findPlayerByJerseyAndTeam(teamId, Number(jerseyNumber), gameDate);
                    if (history) {
                        playerId = history.playerId;
                    }
                } catch (err) {
                    this.logger.warn(`[Resolution] Error looking up existing player`, { error: err });
                }
            }

            // If still a placeholder, convert to deterministic UUID
            if (playerId && !this.isUuid(playerId)) {
                playerId = uuidv5(`${gameId}:${playerId}`, STATVISION_NAMESPACE);
            }
            event.assignedPlayerId = playerId;
            
            resolvedEvents.push(event);
        }
        return resolvedEvents;
    }

    private async processFinalResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        this.logger.info(`[JOB_FINALIZE] 🏁 Finalizing Game ID: ${result.gameId} | Status: ${result.status}`, { phase: 'results_processing' });
        
        // Final sync of entities and events
        await this.persistIdentifiedEntities(result);
        await this.processChunkResult(result); // Final push to GameEvent table

        let gameStatusToUpdate: GameStatus;
        if (result.status === VideoAnalysisJobStatus.COMPLETED) {
            gameStatusToUpdate = GameStatus.ANALYZED;
        } else if (result.status === VideoAnalysisJobStatus.RETRYABLE_FAILED) {
            gameStatusToUpdate = GameStatus.ANALYSIS_FAILED_RETRYABLE;
        } else {
            gameStatusToUpdate = GameStatus.FAILED;
        }

        await this.gameRepository.updateStatus(result.gameId, gameStatusToUpdate, result.failedChunkInfo);

        if (gameStatusToUpdate === GameStatus.ANALYZED) {
            await this.gameStatsService.calculateAndStoreStats(result.gameId);
            this.logger.info(`[JOB_SUCCESS] 🎉 Game ${result.gameId} analysis complete and stats calculated.`, { phase: 'results_processing' });
        } else {
            this.logger.error(`[JOB_FAILURE] ❌ Game ${result.gameId} failed with status: ${gameStatusToUpdate}`, { phase: 'results_processing' });
        }
    }

    private async persistIdentifiedEntities(result: VideoAnalysisJobResultMessage): Promise<void> {
        const game = await this.dataSource.getRepository(Game).findOne({ where: { id: result.gameId } });
        if (!game) return;

        // Process Teams
        if (result.identifiedTeams && result.identifiedTeams.length > 0) {
            for (const teamData of result.identifiedTeams) {
                let teamId = teamData.id;

                // Apply Official Mapping
                if (teamId === 'TEMP_TEAM_1' && game.homeTeamId) {
                    teamId = game.homeTeamId;
                } else if (teamId === 'TEMP_TEAM_2' && game.awayTeamId) {
                    teamId = game.awayTeamId;
                }

                // Deterministic UUID
                if (!this.isUuid(teamId)) {
                    teamId = uuidv5(`${result.gameId}:${teamId}`, STATVISION_NAMESPACE);
                }

                let team = await this.dataSource.getRepository(Team).findOne({ where: { id: teamId } });
                if (!team) {
                    team = new Team();
                    team.id = teamId;
                    team.name = teamData.name || `${teamData.type === 'HOME' ? 'Home' : 'Away'} Team (${teamData.color})`;
                    team.isTemp = true;
                    team.userId = result.userId;
                    await this.dataSource.getRepository(Team).save(team);
                    this.logger.info(`[Discovery] Created Temp Team: ${team.name}`, { teamId });
                }
            }
        }

        // Process Players
        if (result.identifiedPlayers && result.identifiedPlayers.length > 0) {
            for (const playerData of result.identifiedPlayers) {
                let playerId = playerData.id;
                let teamId = playerData.teamId;

                // Resolve Team first
                if (teamId === 'TEMP_TEAM_1' && game.homeTeamId) teamId = game.homeTeamId;
                else if (teamId === 'TEMP_TEAM_2' && game.awayTeamId) teamId = game.awayTeamId;
                if (teamId && !this.isUuid(teamId)) teamId = uuidv5(`${result.gameId}:${teamId}`, STATVISION_NAMESPACE);

                // Check for official player assignment
                if (this.isUuid(teamId) && playerData.jerseyNumber) {
                    const history = await this.playerRepository.findPlayerByJerseyAndTeam(teamId, Number(playerData.jerseyNumber), game.gameDate || new Date());
                    if (history) playerId = history.playerId;
                }

                // Deterministic UUID
                if (!this.isUuid(playerId)) {
                    playerId = uuidv5(`${result.gameId}:${playerId}`, STATVISION_NAMESPACE);
                }

                let player = await this.dataSource.getRepository(Player).findOne({ where: { id: playerId } });
                if (!player) {
                    player = new Player();
                    player.id = playerId;
                    player.name = playerData.name || `Player #${playerData.jerseyNumber}`;
                    player.position = playerData.position || null;
                    player.isTemp = true;
                    await this.dataSource.getRepository(Player).save(player);
                    this.logger.info(`[Discovery] Created Temp Player: ${player.name}`, { playerId });
                }
            }
        }
    }
}
