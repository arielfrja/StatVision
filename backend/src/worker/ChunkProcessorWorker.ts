import { ProgressManager } from './ProgressManager';
import { PubSub, Message } from '@google-cloud/pubsub';
import { DataSource } from 'typeorm';
import { chunkLogger } from '../config/loggers';
import { VideoAnalysisJobRepository } from './VideoAnalysisJobRepository';
import { ChunkRepository } from './ChunkRepository';
import { GeminiAnalysisService } from './GeminiAnalysisService';
import { EventProcessorService } from './EventProcessorService';
import { Chunk, ChunkStatus } from './Chunk';
import { VideoAnalysisJobStatus } from './VideoAnalysisJob';
import { workerConfig } from '../config/workerConfig';
import { GoogleGenAI } from '@google/genai';
import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from '../interfaces/video-analysis.interfaces';
import { JobFinalizerService } from './JobFinalizerService';
import { GameEventRepository } from '../repository/GameEventRepository'; // Import GameEventRepository
import { PlayerRepository } from '../repository/PlayerRepository';     // Import PlayerRepository
import { TeamRepository } from '../repository/TeamRepository';         // Import TeamRepository
import { GameEvent } from '../GameEvent'; // Import GameEvent entity
import { Player } from '../Player';     // Import Player entity
import { Team } from '../Team';         // Import Team entity

const CHUNK_ANALYSIS_SUBSCRIPTION_NAME = process.env.CHUNK_ANALYSIS_SUBSCRIPTION_NAME || 'chunk-analysis-sub';

interface ChunkMessage {
    jobId: string;
    chunkId: string;
}

    export class ChunkProcessorWorker {
        private pubSubClient: PubSub;
        private jobRepository: VideoAnalysisJobRepository;
        private chunkRepository: ChunkRepository;
        private geminiAnalysisService: GeminiAnalysisService;
        private eventProcessorService: EventProcessorService;
        private jobFinalizerService: JobFinalizerService;
        private gameEventRepository: GameEventRepository; // New
        private playerRepository: PlayerRepository;     // New
        private teamRepository: TeamRepository;         // New
        private logger = chunkLogger;
        private processingMode: string;

        constructor(
            private dataSource: DataSource,
            gameEventRepository: GameEventRepository, // Injected
            playerRepository: PlayerRepository,     // Injected
            teamRepository: TeamRepository          // Injected
        ) {
            this.pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
            this.jobRepository = new VideoAnalysisJobRepository(dataSource);
            this.chunkRepository = new ChunkRepository(dataSource);
            this.eventProcessorService = new EventProcessorService();
            this.jobFinalizerService = new JobFinalizerService(dataSource);
            this.gameEventRepository = gameEventRepository; // Assign
            this.playerRepository = playerRepository;     // Assign
            this.teamRepository = teamRepository;         // Assign
            this.processingMode = workerConfig.processingMode;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable not set!");
        }
        const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        this.geminiAnalysisService = new GeminiAnalysisService(genAI);
    }

    public async startConsumingMessages(): Promise<void> {
        this.logger.info('ChunkProcessorWorker: Starting to consume messages from Pub/Sub...', { phase: 'analyzing' });
        const subscription = this.pubSubClient.subscription(CHUNK_ANALYSIS_SUBSCRIPTION_NAME, {
            flowControl: {
                maxMessages: 1, // Only process one message at a time
            },
        });

        subscription.on('message', async (message: Message) => {
            this.logger.info(`Received chunk message ${message.id}:`, { phase: 'analyzing' });
            this.logger.info(`	Data: ${message.data}`, { phase: 'analyzing' });

            let heartbeat: NodeJS.Timeout | null = null;
            const extendAckDeadline = () => {
                message.modAck(workerConfig.ackDeadlineSeconds);
                this.logger.debug(`Extended ack deadline for chunk message ${message.id}`, { phase: 'analyzing' });
            };

            heartbeat = setInterval(extendAckDeadline, workerConfig.heartbeatIntervalSeconds * 1000);

            let chunk: Chunk | null = null;
            let jobId: string | null = null;

            try {
                const parsedMessage: ChunkMessage = JSON.parse(message.data.toString());
                jobId = parsedMessage.jobId;
                const { chunkId } = parsedMessage;

                chunk = await this.chunkRepository.findOneById(chunkId);
                if (!chunk) {
                    this.logger.error(`Chunk ${chunkId} not found for job ${jobId}. Acknowledging message.`, { phase: 'analyzing' });
                    message.ack();
                    return;
                }

                if (chunk.status === ChunkStatus.COMPLETED || chunk.status === ChunkStatus.FAILED) {
                    this.logger.info(`Chunk ${chunkId} for job ${jobId} is already in a terminal state: ${chunk.status}. Skipping analysis.`, { phase: 'analyzing' });
                    message.ack();
                    return;
                }

                let previousSignature: string | null = null;

                // --- Queue Indexing Logic for Sequential Mode ---
                if (this.processingMode === 'SEQUENTIAL' && chunk.sequence > 0) {
                    // Introduce a small delay to mitigate race conditions where previous chunk's status
                    // might not have been committed/propagated to the database yet.
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                    const previousChunk = await this.chunkRepository.findByJobIdAndSequence(jobId, chunk.sequence - 1);
                    if (!previousChunk) {
                        this.logger.error(`[SEQUENTIAL] Previous chunk (sequence ${chunk.sequence - 1}) for job ${jobId} not found for chunk ${chunk.sequence}. This indicates a data inconsistency. Nacking.`, { phase: 'analyzing' });
                        message.nack(); // Nack to retry later, hoping consistency is restored
                        if (heartbeat) clearInterval(heartbeat);
                        return;
                    }

                    if (previousChunk.status !== ChunkStatus.COMPLETED) {
                        this.logger.info(`[SEQUENTIAL] Previous chunk (sequence ${previousChunk.sequence}) for job ${jobId} is not yet COMPLETED (status: ${previousChunk.status}). Nacking message for chunk ${chunk.sequence}.`, { phase: 'analyzing' });
                        message.nack(); // Nack to retry later
                        if (heartbeat) clearInterval(heartbeat);
                        return;
                    }
                    this.logger.info(`[SEQUENTIAL] Previous chunk (sequence ${previousChunk.sequence}) for job ${jobId} is COMPLETED. Proceeding with chunk ${chunk.sequence}.`, { phase: 'analyzing' });
                    previousSignature = previousChunk.thoughtSignature;
                
                } else if (this.processingMode === 'PARALLEL') {
                    // --- WIP-Limit per Stage Logic for Parallel Mode ---
                    const stageLimit = workerConfig.parallelStageLimit;
                    const analyzingInStage = await this.chunkRepository.countAnalyzingChunksForSequence(chunk.sequence);

                    if (analyzingInStage >= stageLimit) {
                        this.logger.info(`[PARALLEL_WIP] Stage ${chunk.sequence} is at capacity (${analyzingInStage}/${stageLimit}). Nacking message for chunk ${chunk.sequence} of job ${jobId}.`, { phase: 'analyzing' });
                        message.nack();
                        if (heartbeat) clearInterval(heartbeat);
                        return;
                    }
                    this.logger.info(`[PARALLEL_WIP] Stage ${chunk.sequence} has capacity (${analyzingInStage}/${stageLimit}). Proceeding with chunk ${chunk.sequence} of job ${jobId}.`, { phase: 'analyzing' });
                }
                // --- End Concurrency Logic ---

                this.logger.info(`[CHUNK_PROCESSOR] Processing chunk ${chunk.sequence} (ID: ${chunk.id}) for job ${jobId}`, { phase: 'analyzing' });

                ProgressManager.getInstance().startIndeterminateBar('Analyzing', `Chunk ${chunk.sequence}`);

                chunk.status = ChunkStatus.ANALYZING;
                await this.chunkRepository.update(chunk);

                const job = await this.jobRepository.findOneById(jobId);
                if (!job) {
                    this.logger.error(`Job ${jobId} not found for chunk ${chunkId}. Marking chunk as FAILED.`, { phase: 'analyzing' });
                    chunk.status = ChunkStatus.FAILED;
                    await this.chunkRepository.update(chunk);
                    message.ack();
                    ProgressManager.getInstance().stopChunkBar();
                    return;
                }

                let identifiedPlayers: IdentifiedPlayer[] = job.identifiedPlayers || [];
                let identifiedTeams: IdentifiedTeam[] = job.identifiedTeams || [];
                const allProcessedEvents: ProcessedGameEvent[] = job.processedEvents || [];
                const processedEventKeys = new Set<string>(allProcessedEvents.map(e => `${e.eventType}-${Math.floor(e.absoluteTimestamp / 5)}-${e.assignedPlayerId || e.assignedTeamId || ''}`));

                const videoChunkInfo = {
                    chunkPath: chunk.chunkPath,
                    startTime: chunk.startTime,
                    sequence: chunk.sequence
                };

                const result = await this.geminiAnalysisService.callGeminiApi(videoChunkInfo, identifiedPlayers, identifiedTeams, previousSignature);

                ProgressManager.getInstance().stopChunkBar();

                if (result.status === 'fulfilled') {
                    const processedResult = this.eventProcessorService.processEvents(
                        result.events,
                        job.gameId,
                        videoChunkInfo,
                        workerConfig.chunkDurationSeconds,
                        workerConfig.chunkOverlapSeconds,
                        processedEventKeys,
                        identifiedPlayers,
                        identifiedTeams
                    );
                    
                    job.identifiedPlayers = processedResult.updatedIdentifiedPlayers;
                    job.identifiedTeams = processedResult.updatedIdentifiedTeams;
                    job.processedEvents = [...allProcessedEvents, ...processedResult.finalEvents];
                    
                    await this.jobRepository.update(job.id, {
                        identifiedPlayers: job.identifiedPlayers,
                        identifiedTeams: job.identifiedTeams,
                        processedEvents: job.processedEvents,
                    });

                    // Save new/updated teams
                    for (const teamData of processedResult.updatedIdentifiedTeams) {
                        const existingTeam = await this.teamRepository.findOneById(teamData.id);
                        if (!existingTeam) {
                            const newTeam = new Team();
                            newTeam.id = teamData.id;
                            newTeam.userId = job.userId; // Associate with job's user
                            newTeam.name = teamData.color ? `${teamData.type} ${teamData.color}` : teamData.type; // Generate a name
                            newTeam.isTemp = true; // Mark as temporary
                            // Other properties as needed
                            await this.teamRepository.save(newTeam);
                            this.logger.debug(`Saved new Team: ${newTeam.name} (ID: ${newTeam.id})`);
                        }
                    }

                    // Save new/updated players
                    for (const playerData of processedResult.updatedIdentifiedPlayers) {
                        const existingPlayer = await this.playerRepository.findOneById(playerData.id);
                        if (!existingPlayer) {
                            const newPlayer = new Player();
                            newPlayer.id = playerData.id;
                            newPlayer.name = playerData.description || `Player ${playerData.jerseyNumber || playerData.id.substring(0, 4)}`; // Generate a name
                            newPlayer.isTemp = true; // Mark as temporary
                            // Other properties as needed
                            await this.playerRepository.save(newPlayer);
                            this.logger.debug(`Saved new Player: ${newPlayer.name} (ID: ${newPlayer.id})`);
                        }
                    }

                    // Save final events
                    const gameEventsToSave = processedResult.finalEvents.map(eventData => {
                        const gameEvent = new GameEvent();
                        gameEvent.id = eventData.id;
                        gameEvent.gameId = eventData.gameId;
                        gameEvent.assignedTeamId = eventData.assignedTeamId;
                        gameEvent.assignedPlayerId = eventData.assignedPlayerId;
                        gameEvent.identifiedTeamColor = eventData.identifiedTeamColor;
                        gameEvent.identifiedJerseyNumber = eventData.identifiedJerseyNumber ? parseInt(eventData.identifiedJerseyNumber) : null;
                        gameEvent.eventType = eventData.eventType;
                        gameEvent.eventDetails = { // Map relevant fields to eventDetails JSONB
                            // description: eventData.description, // Removed as per fix
                            isSuccessful: eventData.isSuccessful,
                            period: eventData.period,
                            timeRemaining: eventData.timeRemaining,
                            xCoord: eventData.xCoord,
                            yCoord: eventData.yCoord,
                            eventSubType: eventData.eventSubType,
                            relatedEventId: eventData.relatedEventId,
                            onCourtPlayerIds: eventData.onCourtPlayerIds,
                        };
                        gameEvent.absoluteTimestamp = eventData.absoluteTimestamp;
                        gameEvent.videoClipStartTime = eventData.videoClipStartTime;
                        gameEvent.videoClipEndTime = eventData.videoClipEndTime;
                        return gameEvent;
                    });
                    await this.gameEventRepository.batchInsert(gameEventsToSave);
                    this.logger.debug(`Saved ${gameEventsToSave.length} game events.`);

                    chunk.status = ChunkStatus.COMPLETED;
                    chunk.thoughtSignature = result.thoughtSignature || null;
                    chunk.rawGeminiResponse = result || null; // Store the entire result object
                    this.logger.info(`[CHUNK_PROCESSOR] Chunk ${chunk.sequence} (ID: ${chunk.id}) completed successfully.`, { phase: 'analyzing' });
                    ProgressManager.getInstance().updateJob(jobId, 1, `Chunk ${chunk.sequence} analyzed`);
                } else {
                    const errorMessage = result.error?.message || 'Unknown Gemini analysis error';
                    const errorStack = result.error?.stack || 'No stack trace available.';
                    this.logger.error(`[CHUNK_PROCESSOR] Chunk ${chunk.sequence} (ID: ${chunk.id}) failed Gemini analysis.`, {
                        error: {
                            message: errorMessage,
                            stack: errorStack,
                            jobId: job.id,
                            chunkId: chunk.id,
                            sequence: chunk.sequence,
                        },
                        phase: 'analyzing'
                    });
                    chunk.status = ChunkStatus.FAILED;
                    chunk.failureReason = errorMessage;
                    chunk.rawGeminiResponse = result || null; // Store the entire result object
                }
                
                await this.chunkRepository.update(chunk);
                message.ack();

            } catch (error: any) {
                const errorMessage = error.message || 'An unknown error occurred during chunk processing.';
                const errorStack = error.stack || 'No stack trace available.';
                this.logger.error(`Error processing chunk message ${message.id} for chunk ${chunk?.id}.`, {
                    error: {
                        message: errorMessage,
                        stack: errorStack,
                        jobId: jobId,
                        chunkId: chunk?.id,
                        messageId: message.id,
                    },
                    phase: 'analyzing'
                });
                ProgressManager.getInstance().stopChunkBar();
                if (chunk) {
                    chunk.status = ChunkStatus.FAILED;
                    chunk.failureReason = errorMessage;
                    await this.chunkRepository.update(chunk);
                }
                message.ack(); // Ack the message, failure is recorded, finalizer will handle job status.
            } finally {
                if (heartbeat) clearInterval(heartbeat);
                if (jobId) {
                    // Always attempt to finalize the job after processing a chunk
                    await this.jobFinalizerService.finalizeJob(jobId);
                }
            }
        });

        subscription.on('error', error => {
            this.logger.error('Received error from Pub/Sub subscription:', error);
        });
    }
}

