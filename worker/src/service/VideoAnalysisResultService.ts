import { DataSource } from "typeorm";
import { Message } from "@google-cloud/pubsub";
import { 
    GameRepository, GameEventRepository, GameStatsService, 
    TeamRepository, PlayerRepository, 
    GameStatus, GameEvent, Team, Player, GameTeamStats, GamePlayerStats, 
    VideoAnalysisJobStatus, GameEventStatus, IEventBus
} from "@statvision/common";
import * as winston from 'winston';

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

export class VideoAnalysisResultService {
    private gameRepository: GameRepository;
    private gameEventRepository: GameEventRepository;
    private gameStatsService: GameStatsService;
    private eventBus: IEventBus;
    private logger: winston.Logger; 
    private teamRepository: TeamRepository; 
    private playerRepository: PlayerRepository; 

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
        await this.persistIdentifiedEntities(result);
        const resolvedEvents = await this.resolvePlayerIds(result.gameId, result.processedEvents, result.userId);

        if (resolvedEvents && resolvedEvents.length > 0) {
            const gameEventsToInsert = resolvedEvents.map(eventData => {
                const event = new GameEvent();
                
                // Explicit Mapping (No Object.assign to avoid data pollution)
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

                // Validated IDs
                event.assignedTeamId = this.isUuid(eventData.assignedTeamId) ? eventData.assignedTeamId : null;
                event.assignedPlayerId = this.isUuid(eventData.assignedPlayerId) ? eventData.assignedPlayerId : null;
                
                event.identifiedTeamColor = eventData.identifiedTeamColor;
                event.identifiedJerseyNumber = typeof eventData.identifiedJerseyNumber === 'number' ? eventData.identifiedJerseyNumber : null;
                
                return event;
            });
            await this.gameEventRepository.batchInsert(gameEventsToInsert);
            this.logger.info(`Successfully streamed \${gameEventsToInsert.length} draft events for game \${result.gameId}.`, { phase: 'results_processing' });
        }
    }

    private isUuid(id: string | null | undefined): boolean {
        if (!id) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof id === 'string' && (id.startsWith('chunk-') || id.startsWith('TEMP_'))) return false;
        return uuidRegex.test(id);
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
        const game = await this.gameRepository.findOneById(gameId);
        if (!game) return events;
        const gameDate = game.gameDate || new Date();
        const resolvedEvents = [];
        
        // Cache for discovered entities in this batch to avoid redundant DB calls
        const discoveryCache = new Map<string, string>();
        const teamDiscoveryCache = new Map<string, string>();

        for (const event of events) {
            let teamId = event.assignedTeamId;
            const jerseyNumber = event.identifiedJerseyNumber;
            const color = event.identifiedTeamColor || 'Unknown';
            const description = event.identifiedPlayerDescription || event.identifiedTeamDescription;

            // --- TEAM RESOLUTION ---
            // 1. Map placeholders if game has assigned teams
            if (teamId === 'TEMP_TEAM_1' && game.homeTeamId) {
                teamId = game.homeTeamId;
            } else if (teamId === 'TEMP_TEAM_2' && game.awayTeamId) {
                teamId = game.awayTeamId;
            }

            // 2. Draft Mode: Create/Resolve Temp Team for colors
            if (!this.isUuid(teamId)) {
                const teamKey = `TEAM-${color}`;
                if (teamDiscoveryCache.has(teamKey)) {
                    teamId = teamDiscoveryCache.get(teamKey);
                } else {
                    try {
                        const teamName = `${color} Team`;
                        const teamRepo = this.teamRepository['teamRepository'];
                        let team = await teamRepo.findOne({ where: { name: teamName, isTemp: true, userId } });
                        
                        if (!team) {
                            team = new Team();
                            team.name = teamName;
                            team.isTemp = true;
                            team.userId = userId;
                            team = await this.teamRepository.save(team);
                            this.logger.info(`[Discovery] Created new Temp Team: ${teamName}`, { teamId: team.id });
                        }
                        teamId = team.id;
                        teamDiscoveryCache.set(teamKey, teamId!);
                    } catch (err) {
                        this.logger.error(`[Discovery] Failed to resolve team for ${color}`, { error: err });
                    }
                }
            }
            event.assignedTeamId = teamId;

            // --- PLAYER RESOLUTION ---
            // 3. Try to find existing player in this team
            if (teamId && jerseyNumber && this.isUuid(teamId)) {
                try {
                    const history = await this.playerRepository.findPlayerByJerseyAndTeam(teamId, Number(jerseyNumber), gameDate);
                    if (history) {
                        event.assignedPlayerId = history.playerId;
                        resolvedEvents.push(event);
                        continue;
                    }
                } catch (err) {
                    this.logger.warn(`[Resolution] Error looking up existing player`, { error: err });
                }
            }

            // 4. Discovery Logic: Create Temp Player
            const discoveryKey = `${teamId}-${jerseyNumber || 'no-num'}-${description || 'no-desc'}`;
            
            if (discoveryCache.has(discoveryKey)) {
                event.assignedPlayerId = discoveryCache.get(discoveryKey);
            } else {
                try {
                    let playerName = `${color} `;
                    if (jerseyNumber) playerName += `#${jerseyNumber}`;
                    if (description) playerName += ` (${description})`;
                    playerName = playerName.trim();

                    const playerRepo = this.playerRepository['playerBaseRepository'];
                    let player = await playerRepo.findOne({ 
                        where: { name: playerName, isTemp: true } 
                    });

                    if (!player) {
                        player = new Player();
                        player.name = playerName;
                        player.isTemp = true;
                        player = await this.playerRepository.save(player);
                        this.logger.info(`[Discovery] Created new Temp Player: ${playerName}`, { playerId: player.id });
                    }

                    event.assignedPlayerId = player.id;
                    discoveryCache.set(discoveryKey, player.id);
                } catch (err) {
                    this.logger.error(`[Discovery] Failed to create temp player for ${discoveryKey}`, { error: err });
                }
            }
            
            resolvedEvents.push(event);
        }
        return resolvedEvents;
    }

    private async processFinalResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        this.logger.info(`[JOB_FINALIZE] 🏁 Finalizing Game ID: ${result.gameId} | Status: ${result.status}`, { phase: 'results_processing' });
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
            await this.persistIdentifiedEntities(result);
            await this.gameStatsService.calculateAndStoreStats(result.gameId);
            this.logger.info(`[JOB_SUCCESS] 🎉 Game ${result.gameId} analysis complete and stats calculated.`, { phase: 'results_processing' });
        } else {
            this.logger.error(`[JOB_FAILURE] ❌ Game ${result.gameId} failed with status: ${gameStatusToUpdate}`, { phase: 'results_processing' });
        }
    }

    private async persistIdentifiedEntities(result: VideoAnalysisJobResultMessage): Promise<void> {
        if (result.identifiedTeams && result.identifiedTeams.length > 0) {
            for (const teamData of result.identifiedTeams) {
                if (!this.isUuid(teamData.id)) continue; 

                let team = await this.teamRepository.findOneById(teamData.id);
                if (!team) {
                    team = new Team();
                    team.id = teamData.id;
                    team.name = `${teamData.type === 'HOME' ? 'Home' : 'Away'} Team${teamData.color ? ' ('+teamData.color+')' : ''}`;
                    team.isTemp = true;
                    team.userId = result.userId;
                    await this.teamRepository.save(team);
                }
                const gameTeamStats = (await this.gameStatsService.getGameTeamStats(result.gameId, teamData.id)) || new GameTeamStats();
                Object.assign(gameTeamStats, { gameId: result.gameId, teamId: teamData.id, ...teamData });
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
                    player.name = `Player${playerData.jerseyNumber ? ' #'+playerData.jerseyNumber : ''}`;
                    player.isTemp = true;
                    await this.playerRepository.save(player);
                }
                const gamePlayerStats = (await this.gameStatsService.getGamePlayerStats(result.gameId, playerData.id)) || new GamePlayerStats();
                Object.assign(gamePlayerStats, { gameId: result.gameId, playerId: playerData.id, ...playerData });
                await this.gameStatsService.saveGamePlayerStats(gamePlayerStats);
            }
        }
    }
}
