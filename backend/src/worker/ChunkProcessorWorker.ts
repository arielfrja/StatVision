import { ProgressManager } from './ProgressManager';
import { Message } from '@google-cloud/pubsub';
import { DataSource } from 'typeorm';
import { chunkLogger } from '../config/loggers';
import { VideoAnalysisJobRepository } from './VideoAnalysisJobRepository';
import { ChunkRepository } from './ChunkRepository';
import { IVideoIntelligenceProvider } from '../core/interfaces/IVideoIntelligenceProvider';
import { GeminiProvider } from './infrastructure/GeminiProvider';
import { IEventBus } from '../core/interfaces/IEventBus';
import { EventProcessorService } from './EventProcessorService';
import { JobFinalizerService } from './JobFinalizerService';
import { workerConfig } from '../config/workerConfig';
import { Chunk, ChunkStatus } from '../core/entities/Chunk';
import { VideoAnalysisJobStatus } from '../core/entities/VideoAnalysisJob';
import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from '../core/interfaces/video-analysis.interfaces';

const CHUNK_ANALYSIS_SUBSCRIPTION_NAME = process.env.CHUNK_ANALYSIS_SUBSCRIPTION_NAME || 'chunk-analysis-sub';

interface ChunkMessage {
    jobId: string;
    chunkId: string;
}

export class ChunkProcessorWorker {
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private videoIntelligenceProvider: IVideoIntelligenceProvider;
    private eventProcessorService: EventProcessorService;
    private jobFinalizerService: JobFinalizerService;
    private logger = chunkLogger;
    private processingMode: string;

    constructor(private dataSource: DataSource, private eventBus: IEventBus) {
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.eventProcessorService = new EventProcessorService();
        this.jobFinalizerService = new JobFinalizerService(dataSource);
        this.processingMode = workerConfig.processingMode;

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable not set!");
        }
        this.videoIntelligenceProvider = new GeminiProvider(GEMINI_API_KEY);
    }

    public async startConsumingMessages(): Promise<void> {
        this.logger.info('ChunkProcessorWorker: Starting to consume messages from Pub/Sub...', { phase: 'analyzing' });
        
        await this.eventBus.subscribe(CHUNK_ANALYSIS_SUBSCRIPTION_NAME, async (parsedMessage: ChunkMessage, message: Message) => {
            this.logger.info(`Received chunk message ${message.id}:`, { phase: 'analyzing' });
            
            let heartbeat: NodeJS.Timeout | null = null;
            const extendAckDeadline = () => {
                message.modAck(workerConfig.ackDeadlineSeconds);
                this.logger.debug(`Extended ack deadline for chunk message ${message.id}`, { phase: 'analyzing' });
            };

            heartbeat = setInterval(extendAckDeadline, workerConfig.heartbeatIntervalSeconds * 1000);

            let chunk: Chunk | null = null;
            let jobId: string | null = null;

            try {
                jobId = parsedMessage.jobId;
                const { chunkId } = parsedMessage;

                // Retry logic for fetching chunk
                let retryCount = 0;
                const maxRetries = 3;
                while (retryCount < maxRetries) {
                    chunk = await this.chunkRepository.findOneById(chunkId);
                    if (chunk) break;

                    this.logger.warn(`Chunk ${chunkId} not found for job ${jobId}. Retrying (${retryCount + 1}/${maxRetries})...`, { phase: 'analyzing' });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retryCount++;
                }

                if (!chunk) {
                    // Check if the job itself is valid and active before Nacking
                    const job = await this.jobRepository.findOneById(jobId);

                    if (!job) {
                        this.logger.warn(`Job ${jobId} not found for chunk message ${chunkId}. Message is orphaned. Acknowledging.`, { phase: 'analyzing' });
                        message.ack();
                        return;
                    }

                    if (job.status === VideoAnalysisJobStatus.COMPLETED || job.status === VideoAnalysisJobStatus.FAILED) {
                        this.logger.info(`Job ${jobId} is already in terminal state (${job.status}). Ignoring missing chunk ${chunkId}. Acknowledging.`, { phase: 'analyzing' });
                        message.ack();
                        return;
                    }

                    this.logger.error(`Chunk ${chunkId} not found for active job ${jobId} after ${maxRetries} retries. Nacking message.`, { phase: 'analyzing' });
                    message.nack();
                    return;
                }

                if (chunk.status === ChunkStatus.COMPLETED || chunk.status === ChunkStatus.FAILED) {
                    this.logger.info(`Chunk ${chunkId} for job ${jobId} is already in a terminal state: ${chunk.status}. Skipping analysis.`, { phase: 'analyzing' });
                    message.ack();
                    return;
                }

                // --- Queue Indexing Logic for Sequential Mode ---
                if (this.processingMode === 'SEQUENTIAL' && chunk.sequence > 0) {
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

                ProgressManager.getInstance().startIndeterminateBar(chunk.id, 'Analyzing', `Chunk ${chunk.sequence}`); // MODIFIED LINE

                chunk.status = ChunkStatus.ANALYZING;
                await this.chunkRepository.update(chunk);

                const job = await this.jobRepository.findOneById(jobId);
                if (!job) {
                    this.logger.error(`Job ${jobId} not found for chunk ${chunkId}. Marking chunk as FAILED.`, { phase: 'analyzing' });
                    chunk.status = ChunkStatus.FAILED;
                    await this.chunkRepository.update(chunk);
                    message.ack();
                    ProgressManager.getInstance().stopChunkBar(chunk.id);
                    return;
                }

                // Fetch visualContext and chatHistory from the Game and Job entities
                const game = await this.dataSource.getRepository("Game").findOne({ where: { id: job.gameId } }) as any;
                const visualContextString = game?.visualContext ? JSON.stringify(game.visualContext, null, 2) : 'No specific visual context provided.';
                const gameType = game?.gameType;
                const identityMode = game?.identityMode;
                const chatHistory = job.chatHistory || [];

                const videoChunkInfo = {
                    chunkPath: chunk.chunkPath,
                    startTime: chunk.startTime,
                    sequence: chunk.sequence
                };

                const result = await this.videoIntelligenceProvider.analyzeVideoChunk(
                    videoChunkInfo, 
                    identifiedPlayers, 
                    identifiedTeams, 
                    visualContextString,
                    gameType,
                    identityMode,
                    chatHistory
                );

                ProgressManager.getInstance().stopChunkBar(chunk.id);

                if (result.events) {
                    // Save the raw response before any filtering occurs.
                    chunk.rawGeminiResponse = result.rawResponse;

                    const processedResult = this.eventProcessorService.processEvents(
                        result.events,
                        job.gameId,
                        videoChunkInfo,
                        workerConfig.chunkDurationSeconds,
                        workerConfig.chunkOverlapSeconds,
                        processedEventKeys,
                        identifiedPlayers,
                        identifiedTeams,
                        gameType,
                        identityMode
                    );
                    
                    chunk.identifiedPlayers = processedResult.updatedIdentifiedPlayers;
                    chunk.identifiedTeams = processedResult.updatedIdentifiedTeams;
                    chunk.processedEvents = processedResult.finalEvents;

                    // Update job's chat history
                    if (result.updatedHistory) {
                        job.chatHistory = result.updatedHistory;
                        await this.jobRepository.update(job.id, { chatHistory: result.updatedHistory });
                    }

                    chunk.status = ChunkStatus.COMPLETED;
                    this.logger.info(`[CHUNK_PROCESSOR] Chunk ${chunk.sequence} (ID: ${chunk.id}) completed successfully.`, { phase: 'analyzing' });
                    ProgressManager.getInstance().updateJob(jobId, 1, `Chunk ${chunk.sequence} analyzed`);
                } else {
                    const errorMessage = result.error?.message || 'Unknown Gemini analysis error';
                    const errorStack = result.error?.stack || 'No stack trace available.';
                    chunk.status = ChunkStatus.FAILED;
                    this.logger.error(`[CHUNK_PROCESSOR] Chunk ${chunk.sequence} (ID: ${chunk.id}) failed Gemini analysis with error: ${errorMessage}`, {
                        error: {
                            message: errorMessage,
                            stack: errorStack,
                            jobId: job.id,
                            chunkId: chunk.id,
                            sequence: chunk.sequence,
                        },
                        phase: 'analyzing'
                    });
                    chunk.failureReason = errorMessage;
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
                ProgressManager.getInstance().stopChunkBar(chunk?.id);
                if (chunk) {
                    chunk.status = ChunkStatus.FAILED;
                    this.logger.error(`Error processing chunk message ${message.id} for chunk ${chunk?.id} with error: ${errorMessage}`, {
                        error: {
                            message: errorMessage,
                            stack: errorStack,
                            jobId: jobId,
                            chunkId: chunk?.id,
                            messageId: message.id,
                        },
                        phase: 'analyzing'
                    });
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
        }, {
            flowControl: {
                maxMessages: 1, // Only process one message at a time
            },
        });
    }
}

