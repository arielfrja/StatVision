import { PubSub, Message } from '@google-cloud/pubsub';
import { VideoAnalysisJob, VideoAnalysisJobStatus } from './VideoAnalysisJob';
import { VideoAnalysisJobRepository } from './VideoAnalysisJobRepository';
import { VideoChunkerService, VideoChunk } from './VideoChunkerService';
import { GeminiAnalysisService } from './GeminiAnalysisService';
import { EventProcessorService } from './EventProcessorService';
import logger from '../config/logger';
import * as path from 'path';
import * as fs from 'fs';
import { IdentifiedPlayer, IdentifiedTeam, ProcessedGameEvent } from '../interfaces/video-analysis.interfaces';
import { DataSource } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Chunk, ChunkStatus } from './Chunk';
import { ChunkRepository } from './ChunkRepository';

const VIDEO_UPLOAD_TOPIC_NAME = process.env.VIDEO_UPLOAD_TOPIC_NAME || 'video-uploads';
const VIDEO_UPLOAD_SUBSCRIPTION_NAME = process.env.VIDEO_UPLOAD_SUBSCRIPTION_NAME || 'video-uploads-subscription';
const VIDEO_ANALYSIS_RESULTS_TOPIC_NAME = process.env.VIDEO_ANALYSIS_RESULTS_TOPIC_NAME || 'video-analysis-results';

interface PubSubMessage {
    gameId: string;
    filePath: string;
    userId: string;
}

export class VideoProcessorWorker {
    private pubSubClient: PubSub;
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private videoChunkerService: VideoChunkerService;
    private geminiAnalysisService: GeminiAnalysisService;
    private eventProcessorService: EventProcessorService;
    private logger = logger;

    constructor(dataSource: DataSource) {
        this.pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.videoChunkerService = new VideoChunkerService();
        this.eventProcessorService = new EventProcessorService();
        
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable not set!");
        }
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.geminiAnalysisService = new GeminiAnalysisService(genAI);
    }

    public async startConsumingMessages(): Promise<void> {
        this.logger.info('VideoProcessorWorker: Starting to consume messages from Pub/Sub...');
        const subscription = this.pubSubClient.subscription(VIDEO_UPLOAD_SUBSCRIPTION_NAME);
        
        subscription.on('message', async (message: Message) => {
            this.logger.info(`Received message ${message.id}:`);
            this.logger.info(`\tData: ${message.data}`);
            
            let job: VideoAnalysisJob | null = null;
            try {
                const parsedMessage: PubSubMessage = JSON.parse(message.data.toString());
                
                job = await this.jobRepository.findOneByGameIdAndFilePath(parsedMessage.gameId, parsedMessage.filePath);

                if (job) {
                    if (job.status === VideoAnalysisJobStatus.COMPLETED) {
                        this.logger.info(`Job ${job.id} for game ${job.gameId} is already completed. Skipping.`);
                        message.ack();
                        return;
                    }
                    if (job.status === VideoAnalysisJobStatus.FAILED) {
                        this.logger.info(`Job ${job.id} for game ${job.gameId} has permanently failed. Skipping.`);
                        message.ack();
                        return;
                    }
                    this.logger.info(`Found existing job ${job.id} with status ${job.status}. Resuming...`);
                } else {
                    this.logger.info(`No existing job found for game ${parsedMessage.gameId}. Creating new job.`);
                    job = new VideoAnalysisJob();
                    job.gameId = parsedMessage.gameId;
                    job.userId = parsedMessage.userId;
                    job.filePath = parsedMessage.filePath;
                    job.status = VideoAnalysisJobStatus.PENDING;
                    job.chunks = [];
                    await this.jobRepository.create(job);
                    this.logger.info(`Created new job ${job.id} for game ${job.gameId}.`);
                }

                await this.processJob(job);
                message.ack();
            } catch (error) {
                this.logger.error(`Error processing Pub/Sub message ${message.id}:`, error);
                if (job) {
                    job.status = VideoAnalysisJobStatus.FAILED;
                    await this.jobRepository.update(job.id, job);
                }
                message.nack();
            }
        });

        subscription.on('error', error => {
            this.logger.error('Received error from Pub/Sub subscription:', error);
        });
    }

    public async processJob(job: VideoAnalysisJob): Promise<void> {
        this.logger.info(`[WORKER] Processing job ${job.id} for Game ID: ${job.gameId}`);

        const heartbeatInterval = setInterval(async () => {
            await this.jobRepository.update(job.id, { processingHeartbeatAt: new Date() });
        }, 60 * 1000);

        let allCreatedChunkPaths: string[] = [];
        try {
            job.status = VideoAnalysisJobStatus.PROCESSING;
            job.processingHeartbeatAt = new Date();
            job.retryCount += 1;
            await this.jobRepository.update(job.id, job);

            const chunkDuration = 150;
            const overlapDuration = 30;
            const tempDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            let chunksToProcess: Chunk[];
            const existingChunks = await this.chunkRepository.findByJobId(job.id);

            if (existingChunks.length === 0) {
                this.logger.info(`[WORKER] Starting fresh analysis for Job ID: ${job.id}. Chunking video...`);
                const videoChunks = await this.videoChunkerService.chunkVideo(job.filePath, tempDir, chunkDuration, overlapDuration);
                
                const newChunks = videoChunks.map(vc => {
                    const chunk = new Chunk();
                    chunk.jobId = job.id;
                    chunk.chunkPath = vc.chunkPath;
                    chunk.startTime = vc.startTime;
                    chunk.sequence = vc.sequence;
                    chunk.status = ChunkStatus.PENDING;
                    return chunk;
                });
                chunksToProcess = await this.chunkRepository.createMany(newChunks);
                job.processedEvents = [];
            } else {
                this.logger.info(`[WORKER] Resuming job ${job.id}. Processing existing chunks.`);
                chunksToProcess = existingChunks;
            }
            allCreatedChunkPaths = chunksToProcess.map(c => c.chunkPath);

            let identifiedPlayers: IdentifiedPlayer[] = job.identifiedPlayers || [];
            let identifiedTeams: IdentifiedTeam[] = job.identifiedTeams || [];
            const allProcessedEvents: ProcessedGameEvent[] = job.processedEvents || [];
            const processedEventKeys = new Set<string>();
            
            this.logger.info(`[WORKER] Gemini API calls will run sequentially for ${chunksToProcess.length} chunks.`);

            for (const chunk of chunksToProcess) {
                if (chunk.status === ChunkStatus.COMPLETED) {
                    this.logger.debug(`[WORKER] Chunk ${chunk.sequence} already completed. Skipping API call.`);
                    continue;
                }

                this.logger.info(`[WORKER] Analyzing chunk ${chunk.sequence + 1}/${chunksToProcess.length} (ID: ${chunk.id})`);
                
                try {
                    chunk.status = ChunkStatus.PROCESSING;
                    await this.chunkRepository.update(chunk);

                    const videoChunkInfo: VideoChunk = {
                        chunkPath: chunk.chunkPath,
                        startTime: chunk.startTime,
                        sequence: chunk.sequence
                    };
                    const result = await this.geminiAnalysisService.callGeminiApi(videoChunkInfo, identifiedPlayers, identifiedTeams);

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
                        
                        allProcessedEvents.push(...processedResult.finalEvents);
                        identifiedPlayers = processedResult.updatedIdentifiedPlayers;
                        identifiedTeams = processedResult.updatedIdentifiedTeams;
                        chunk.status = ChunkStatus.COMPLETED;
                        await this.chunkRepository.update(chunk);
                        this.logger.info(`[WORKER] Chunk ${chunk.sequence} completed successfully.`);
                    } else {
                        this.logger.error(`[WORKER] Chunk ${chunk.sequence} failed Gemini analysis. Error: ${result.error?.message || 'Unknown'}`);
                        chunk.status = ChunkStatus.FAILED;
                        await this.chunkRepository.update(chunk);
                    }
                } catch (chunkError) {
                    this.logger.error(`[WORKER] Unhandled error processing chunk ${chunk.sequence}:`, chunkError);
                    chunk.status = ChunkStatus.FAILED;
                    await this.chunkRepository.update(chunk);
                }
            }

            job.processedEvents = allProcessedEvents;
            job.identifiedPlayers = identifiedPlayers;
            job.identifiedTeams = identifiedTeams;
            
            await this.jobRepository.update(job.id, job);

        } catch (error) {
            this.logger.error(`[WORKER] Unrecoverable error in processJob ${job.id}:`, error);
            job.status = VideoAnalysisJobStatus.FAILED;
                        await this.jobRepository.update(job.id, job);        } finally {
            clearInterval(heartbeatInterval);
            
            if (job.status === VideoAnalysisJobStatus.COMPLETED || job.status === VideoAnalysisJobStatus.FAILED) {
                await this.videoChunkerService.cleanupChunks(allCreatedChunkPaths);
            } else {
                this.logger.warn(`[WORKER] Job ${job.id} in state ${job.status}. Retaining chunk files for retry.`);
            }
            await this.sendJobResultToMainBackend(job);
        }
    }

    private async updateParentJobStatus(job: VideoAnalysisJob): Promise<void> {
        const chunks = await this.chunkRepository.findByJobId(job.id);
        const totalChunks = chunks.length;
        const completedChunks = chunks.filter(c => c.status === ChunkStatus.COMPLETED).length;
        const failedChunks = chunks.filter(c => c.status === ChunkStatus.FAILED).length;
        const processingChunks = chunks.filter(c => c.status === ChunkStatus.PROCESSING).length;

        if (totalChunks > 0 && completedChunks === totalChunks) {
            job.status = VideoAnalysisJobStatus.COMPLETED;
            job.retryCount = 0;
            this.logger.info(`[WORKER] Job ${job.id} status set to COMPLETED.`);
        } else if (failedChunks > 0) {
            job.status = VideoAnalysisJobStatus.RETRYABLE_FAILED;
            this.logger.warn(`[WORKER] Job ${job.id} status set to RETRYABLE_FAILED due to ${failedChunks} failed chunks.`);
        } else if (processingChunks > 0) {
            job.status = VideoAnalysisJobStatus.PROCESSING;
            this.logger.info(`[WORKER] Job ${job.id} status remains PROCESSING.`);
        } else {
            job.status = VideoAnalysisJobStatus.PENDING;
            this.logger.warn(`[WORKER] Job ${job.id} status set to PENDING (unexpected state after chunk processing).`);
        }
    }

    private async sendJobResultToMainBackend(job: VideoAnalysisJob): Promise<void> {
        const resultMessage = {
            jobId: job.id,
            gameId: job.gameId,
            userId: job.userId,
            status: job.status,
            identifiedTeams: job.identifiedTeams,
            identifiedPlayers: job.identifiedPlayers,
            processedEvents: job.processedEvents,
        };
        const dataBuffer = Buffer.from(JSON.stringify(resultMessage));

        try {
            const topic = this.pubSubClient.topic(VIDEO_ANALYSIS_RESULTS_TOPIC_NAME);
            const messageId = await topic.publishMessage({ data: dataBuffer });
            this.logger.info(`[WORKER] Published job result for Job ID: ${job.id}. Message ID: ${messageId}`);
        } catch (error) {
            this.logger.error(`[WORKER] Failed to publish job result for Job ID: ${job.id}:`, error);
        }
    }
}
