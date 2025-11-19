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
import { GoogleGenAI } from '@google/genai';
import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from '../interfaces/video-analysis.interfaces';
import { JobFinalizerService } from './JobFinalizerService';

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
    private logger = chunkLogger;

    constructor(private dataSource: DataSource) {
        this.pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.eventProcessorService = new EventProcessorService();
        this.jobFinalizerService = new JobFinalizerService(dataSource);

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
                message.modAck(60);
                this.logger.debug(`Extended ack deadline for chunk message ${message.id}`, { phase: 'analyzing' });
            };

            heartbeat = setInterval(extendAckDeadline, 45 * 1000);

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

                const chunkDuration = 150;
                const overlapDuration = 30;

                const videoChunkInfo = {
                    chunkPath: chunk.chunkPath,
                    startTime: chunk.startTime,
                    sequence: chunk.sequence
                };

                const result = await this.geminiAnalysisService.callGeminiApi(videoChunkInfo, identifiedPlayers, identifiedTeams);

                ProgressManager.getInstance().stopChunkBar();

                if (result.status === 'fulfilled') {
                    const processedResult = this.eventProcessorService.processEvents(
                        result.events,
                        job.gameId,
                        videoChunkInfo,
                        chunkDuration,
                        overlapDuration,
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

                    chunk.status = ChunkStatus.COMPLETED;
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

