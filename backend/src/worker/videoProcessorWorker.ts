import { PubSub, Message, SubscriptionOptions } from '@google-cloud/pubsub';
import { workerConfig } from '../config/workerConfig';
import { VideoAnalysisJob, VideoAnalysisJobStatus } from './VideoAnalysisJob';
import { VideoAnalysisJobRepository } from './VideoAnalysisJobRepository';
import { VideoChunkerService, VideoChunk } from './VideoChunkerService';
import { ProgressManager } from './ProgressManager';
import { jobLogger, chunkLogger } from '../config/loggers';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource } from 'typeorm';
import { Chunk, ChunkStatus } from './Chunk';
import { ChunkRepository } from './ChunkRepository';
import * as cliProgress from 'cli-progress';

const VIDEO_UPLOAD_SUBSCRIPTION_NAME = process.env.VIDEO_UPLOAD_SUBSCRIPTION_NAME || 'video-upload-events-sub';
const CHUNK_ANALYSIS_TOPIC_NAME = process.env.CHUNK_ANALYSIS_TOPIC_NAME || 'chunk-analysis';

interface PubSubMessage {
    gameId: string;
    filePath: string;
    userId: string;
}

export class VideoOrchestratorService {
    private pubSubClient: PubSub;
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private videoChunkerService: VideoChunkerService;
    private jobLogger = jobLogger;
    private chunkLogger = chunkLogger;
    private processingMode: string;

    constructor(
        private dataSource: DataSource
    ) {
        this.pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.videoChunkerService = new VideoChunkerService();
        this.processingMode = workerConfig.processingMode;
    }

    public async startConsumingMessages(): Promise<void> {
        this.jobLogger.info(`VideoOrchestratorService: Starting to consume messages in ${this.processingMode} mode...`, { phase: 'orchestration' });

        const subscriptionOptions: SubscriptionOptions = {
            flowControl: {
                maxMessages: this.processingMode === 'SEQUENTIAL' ? 1 : workerConfig.parallelJobLimit,
            },
        };

        const subscription = this.pubSubClient.subscription(VIDEO_UPLOAD_SUBSCRIPTION_NAME, subscriptionOptions);
        const chunkAnalysisTopic = this.pubSubClient.topic(CHUNK_ANALYSIS_TOPIC_NAME);

        subscription.on('message', async (message: Message) => {
            this.jobLogger.info(`Received message ${message.id}:`, { phase: 'orchestration' });
            this.jobLogger.info(`	Data: ${message.data}`, { phase: 'orchestration' });

            let heartbeat: NodeJS.Timeout | null = null;
            const extendAckDeadline = () => {
                message.modAck(workerConfig.ackDeadlineSeconds);
                this.jobLogger.debug(`Extended ack deadline for message ${message.id}`, { phase: 'orchestration' });
            };

            heartbeat = setInterval(extendAckDeadline, workerConfig.heartbeatIntervalSeconds * 1000);

            let job: VideoAnalysisJob | null = null;
            try {
                const parsedMessage: PubSubMessage = JSON.parse(message.data.toString());

                const existingJob = await this.jobRepository.findOneByGameIdAndFilePath(parsedMessage.gameId, parsedMessage.filePath);

                if (existingJob) {
                    job = existingJob;
                    if (job.status === VideoAnalysisJobStatus.COMPLETED || job.status === VideoAnalysisJobStatus.FAILED) {
                        this.jobLogger.info(`Job ${job.id} for game ${job.gameId} is already in a terminal state (${job.status}). Skipping.`, { phase: 'orchestration' });
                        if (heartbeat) clearInterval(heartbeat);
                        message.ack();
                        return;
                    }
                    this.jobLogger.info(`Found existing job ${job.id} with status ${job.status}. Resuming orchestration...`, { phase: 'orchestration' });
                } else {
                    this.jobLogger.info(`No existing job found for game ${parsedMessage.gameId}. Creating new job.`, { phase: 'orchestration' });
                    job = new VideoAnalysisJob();
                    job.gameId = parsedMessage.gameId;
                    job.userId = parsedMessage.userId;
                    job.filePath = parsedMessage.filePath;
                    job.status = VideoAnalysisJobStatus.PENDING;
                    job.chunks = [];
                    job = await this.jobRepository.create(job);
                    this.jobLogger.info(`Created new job ${job.id} for game ${job.gameId}.`, { phase: 'orchestration' });
                }

                if (!job) {
                    throw new Error("VideoAnalysisJob could not be created or found.");
                }

                this.jobLogger.info(`[ORCHESTRATOR] Starting orchestration for Job ID: ${job.id}`, { phase: 'orchestration' });
                await this.jobRepository.update(job.id, { status: VideoAnalysisJobStatus.PROCESSING, processingHeartbeatAt: new Date() });

                const tempDir = path.join(__dirname, '../../tmp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                await this.orchestrateChunking(job, tempDir, chunkAnalysisTopic);

                if (this.processingMode === 'SEQUENTIAL') {
                    this.jobLogger.info(`[SEQUENTIAL MODE] Orchestration for job ${job.id} complete. Now waiting for job to finalize...`, { phase: 'orchestration' });
                    await this.waitForJobCompletion(job.id);
                    this.jobLogger.info(`[SEQUENTIAL MODE] Job ${job.id} has finalized. Acknowledging message to process next job.`, { phase: 'orchestration' });
                }

                if (heartbeat) clearInterval(heartbeat);
                message.ack();

            } catch (error: any) {
                const errorMessage = error.message || 'An unknown error occurred during orchestration.';
                const errorStack = error.stack || 'No stack trace available.';
                this.jobLogger.error(`Error orchestrating Pub/Sub message ${message.id} for job ${job?.id}.`, {
                    error: {
                        message: errorMessage,
                        stack: errorStack,
                        jobId: job?.id,
                        gameId: job?.gameId,
                        filePath: job?.filePath,
                        messageId: message.id,
                    },
                    phase: 'orchestration'
                });

                if (job) {
                    await this.jobRepository.update(job.id, {
                        status: VideoAnalysisJobStatus.RETRYABLE_FAILED,
                        failureReason: errorMessage,
                        retryCount: (job.retryCount || 0) + 1
                    });
                }
                if (heartbeat) clearInterval(heartbeat);
                message.ack();
            }
        });

        subscription.on('error', (error: any) => {
            this.jobLogger.error('Received error from Pub/Sub subscription:', { error, phase: 'orchestration' });
        });
    }

    private async orchestrateChunking(job: VideoAnalysisJob, tempDir: string, chunkAnalysisTopic: any): Promise<void> {
        this.jobLogger.info(`[Orchestrator] Starting chunk-by-chunk orchestration for job ${job.id}`, { phase: 'orchestration' });

        const chunkDuration = workerConfig.chunkDurationSeconds;
        const overlap = workerConfig.chunkOverlapSeconds;

        const metadata = await this.videoChunkerService.getVideoMetadata(job.filePath);
        const totalDuration = metadata.duration;
        const frameRate = metadata.frameRate;
        const step = chunkDuration - overlap;
        const totalChunks = Math.ceil((totalDuration > overlap ? totalDuration - overlap : totalDuration) / step);

        ProgressManager.getInstance().addJob(job.id, totalChunks);

        this.jobLogger.info(`[Orchestrator] Video duration: ${totalDuration}s. Total chunks to ensure: ${totalChunks}`, { phase: 'orchestration' });

        const existingChunks = await this.chunkRepository.findByJobId(job.id);
        const chunkMap = new Map(existingChunks.map(c => [c.sequence, c]));
        this.chunkLogger.debug(`[Orchestrator] Initial chunkMap for job ${job.id}: ${JSON.stringify(Array.from(chunkMap.entries()))}`, { phase: 'chunking' });
        this.chunkLogger.info(`[Orchestrator] Found ${existingChunks.length} existing chunk records for this job.`, { phase: 'chunking' });

        for (let sequence = 0; sequence < totalChunks; sequence++) {
            const startTime = sequence * step;
            let chunk: Chunk | null | undefined = chunkMap.get(sequence);

            this.chunkLogger.debug(`[Orchestrator] Debugging sequence ${sequence}: chunkMap.get(${sequence}) returned: ${chunk ? JSON.stringify(chunk) : 'undefined'}`, { phase: 'chunking' });

            if (chunk) {
                const status = chunk.status;
                if (status === ChunkStatus.COMPLETED || status === ChunkStatus.AWAITING_ANALYSIS || status === ChunkStatus.ANALYZING) {
                    this.chunkLogger.debug(`[Orchestrator] Chunk ${sequence} already processed or in progress (status: ${status}). Skipping.`, { phase: 'chunking' });
                    continue;
                }
                this.chunkLogger.info(`[Orchestrator] Retrying chunk ${sequence} with status ${status}.`, { phase: 'chunking' });
            } else {
                this.chunkLogger.info(`[Orchestrator] Attempting to create new record for chunk ${sequence}.`, { phase: 'chunking' });
                try {
                    let newChunk = new Chunk();
                    newChunk.jobId = job.id;
                    newChunk.sequence = sequence;
                    newChunk.startTime = startTime;
                    newChunk.status = ChunkStatus.PENDING;
                    newChunk.chunkPath = ''; // No path yet
                    chunk = await this.chunkRepository.create(newChunk);
                    this.chunkLogger.info(`[Orchestrator] Saved new chunk record ${chunk.id} for sequence ${sequence}.`, { phase: 'chunking' });
                } catch (error: any) {
                    // Handle race condition where another process created the chunk in the meantime.
                    // '23505' is the PostgreSQL error code for unique_violation.
                    if (error.code === '23505') {
                        this.chunkLogger.warn(`[Orchestrator] Race condition detected for chunk ${sequence}. Record already exists. Fetching it.`, { phase: 'chunking' });
                        chunk = await this.chunkRepository.findByJobIdAndSequence(job.id, sequence);
                        if (!chunk) {
                            // This should be logically impossible if the error was a duplicate key violation.
                            // But as a safeguard, we throw a more specific error.
                            const criticalError = new Error(`[Orchestrator] Race condition led to duplicate key error, but could not fetch the existing chunk for sequence ${sequence}.`);
                            this.chunkLogger.error(criticalError.message, { error, phase: 'chunking' });
                            throw criticalError;
                        }
                    } else {
                        // Re-throw any other unexpected errors
                        throw error;
                    }
                }
            }

            if (!chunk) {
                this.chunkLogger.error(`[Orchestrator] Failed to create or find chunk record for sequence ${sequence}. Skipping.`, { phase: 'chunking' });
                continue;
            }

            try {
                this.chunkLogger.info(`[Orchestrator] Starting to process chunk ${sequence} (ID: ${chunk.id})`, { phase: 'chunking' });
                chunk.status = ChunkStatus.CHUNKING;
                await this.chunkRepository.update(chunk);

                const currentChunkDuration = Math.min(chunkDuration, totalDuration - startTime);
                
                if (currentChunkDuration < overlap && sequence > 0) {
                    this.chunkLogger.info(`[Orchestrator] Final chunk is too small. Marking as complete and skipping.`, { phase: 'chunking' });
                    chunk.status = ChunkStatus.COMPLETED;
                    await this.chunkRepository.update(chunk);
                    continue;
                }

                const chunkPath = await this.videoChunkerService.createSingleChunk(
                    job.filePath,
                    tempDir,
                    startTime,
                    currentChunkDuration,
                    sequence,
                    totalChunks,
                    frameRate,
                    job.id
                );

                this.chunkLogger.info(`[Orchestrator] Chunk file created for sequence ${sequence} at ${chunkPath}.`, { phase: 'chunking' });
                chunk.status = ChunkStatus.AWAITING_ANALYSIS;
                chunk.chunkPath = chunkPath;
                await this.chunkRepository.update(chunk);

                this.chunkLogger.info(`[Orchestrator] Publishing analysis message for chunk ${sequence} (ID: ${chunk.id})`, { phase: 'chunking' });
                await chunkAnalysisTopic.publishMessage({ json: { jobId: job.id, chunkId: chunk.id } });

            } catch (error: any) {
                const errorMessage = error.message || 'An unknown error occurred during chunk processing.';
                const errorStack = error.stack || 'No stack trace available.';
                this.chunkLogger.error(`[Orchestrator] Error processing chunk ${sequence} for job ${job.id}.`, {
                    error: {
                        message: errorMessage,
                        stack: errorStack,
                        jobId: job.id,
                        chunkId: chunk?.id,
                        sequence: sequence,
                    },
                    phase: 'chunking'
                });
                if (chunk) {
                    chunk.status = ChunkStatus.RETRYABLE_FAILED;
                    chunk.failureReason = errorMessage;
                    await this.chunkRepository.update(chunk);
                }
            }
        }
        this.jobLogger.info(`[Orchestrator] Finished chunk-by-chunk orchestration for job ${job.id}`, { phase: 'orchestration' });
    }

    private async waitForJobCompletion(jobId: string): Promise<void> {
        // A simple polling mechanism to wait for job completion in SEQUENTIAL mode.
        const pollInterval = workerConfig.heartbeatIntervalSeconds * 1000;
        while (true) {
            const job = await this.jobRepository.findOneById(jobId);
            if (!job) {
                this.jobLogger.error(`[waitForJobCompletion] Job ${jobId} disappeared during polling. Aborting wait.`, { phase: 'orchestration' });
                return;
            }
            if (job.status === VideoAnalysisJobStatus.COMPLETED || job.status === VideoAnalysisJobStatus.FAILED) {
                this.jobLogger.info(`[waitForJobCompletion] Job ${jobId} reached terminal state: ${job.status}`, { phase: 'orchestration' });
                return;
            }
            this.jobLogger.debug(`[waitForJobCompletion] Job ${jobId} is still in state: ${job.status}. Waiting ${pollInterval / 1000}s...`, { phase: 'orchestration' });
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }
}
