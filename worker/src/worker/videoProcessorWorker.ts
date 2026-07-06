import { Message, SubscriptionOptions } from '@google-cloud/pubsub';
import { CloudTasksClient } from '@google-cloud/tasks';
import { workerConfig } from '../config/workerConfig';
import { 
    VideoAnalysisJob, VideoAnalysisJobStatus, 
    Chunk, ChunkStatus, Game,
    IEventBus, IStorageProvider, IVideoIntelligenceProvider
} from "@statvision/common";

import { VideoAnalysisJobRepository } from './VideoAnalysisJobRepository';
import { VideoChunkerService, VideoChunk } from './VideoChunkerService';
import { ProgressManager } from './ProgressManager';
import { jobLogger, chunkLogger } from '../config/loggers';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource, Repository } from 'typeorm';
import { ChunkRepository } from './ChunkRepository';

import { VideoAnalysisResultService } from '../service/VideoAnalysisResultService';
import { JobFinalizerService } from './JobFinalizerService';

import { GameStatsService, GameRepository, GameTeamStatsRepository, GamePlayerStatsRepository } from '@statvision/common';

const VIDEO_UPLOAD_SUBSCRIPTION_NAME = process.env.VIDEO_UPLOAD_SUBSCRIPTION_NAME || 'video-upload-events-sub';
const CHUNK_ANALYSIS_TOPIC_NAME = process.env.CHUNK_ANALYSIS_TOPIC_NAME || 'chunk-analysis';

interface PubSubMessage {
    gameId: string;
    filePath: string;
    userId: string;
}

export class VideoOrchestratorService {
    private jobRepository: VideoAnalysisJobRepository;
    private gameRepository: Repository<Game>;
    private chunkRepository: ChunkRepository;
    private videoChunkerService: VideoChunkerService;
    private jobFinalizerService: JobFinalizerService;
    private videoAnalysisResultService: VideoAnalysisResultService;
    private tasksClient: CloudTasksClient;
    private jobLogger = jobLogger;
    private chunkLogger = chunkLogger;
    private processingMode: string;

    constructor(
        private dataSource: DataSource, 
        private eventBus: IEventBus,
        private progressManager: ProgressManager,
        private storageProvider: IStorageProvider,
        private analysisProvider?: IVideoIntelligenceProvider
    ) {
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.gameRepository = dataSource.getRepository(Game);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.videoChunkerService = new VideoChunkerService();
        
        const gRepo = new GameRepository(dataSource, jobLogger);
        const tsRepo = new GameTeamStatsRepository(dataSource);
        const psRepo = new GamePlayerStatsRepository(dataSource);
        const gameStatsService = new GameStatsService(gRepo, tsRepo, psRepo, jobLogger);

        this.videoAnalysisResultService = new VideoAnalysisResultService(
            dataSource, 
            jobLogger, 
            gameStatsService, 
            eventBus
        );

        this.jobFinalizerService = new JobFinalizerService(
            dataSource, 
            eventBus, 
            progressManager, 
            storageProvider,
            this.videoAnalysisResultService,
            analysisProvider
        );
        this.tasksClient = new CloudTasksClient();
        this.processingMode = workerConfig.processingMode;
    }

    public async startConsumingMessages(): Promise<void> {
        this.jobLogger.info('[ORCHESTRATOR] Starting to consume messages from Pub/Sub...', { phase: 'orchestration' });

        await this.eventBus.subscribe(VIDEO_UPLOAD_SUBSCRIPTION_NAME, async (parsedMessage: PubSubMessage, message: Message) => {
            this.jobLogger.info(`[ORCHESTRATOR] Received video upload event for Game ID: ${parsedMessage.gameId}`, { phase: 'orchestration' });
            try {
                await this.processVideoUpload(parsedMessage);
                message.ack();
            } catch (error: any) {
                this.jobLogger.error(`[ORCHESTRATOR] Error processing video upload for Game ID: ${parsedMessage.gameId}`, { error, phase: 'orchestration' });
                message.nack();
            }
        });

        this.jobLogger.info(`[ORCHESTRATOR] Consumer started for subscription: ${VIDEO_UPLOAD_SUBSCRIPTION_NAME}`, { phase: 'orchestration' });
    }

    public async processVideo(gameId: string, filePath: string, userId: string): Promise<void> {
        this.jobLogger.info(`[ORCHESTRATOR] Direct orchestration request for game ${gameId}`, { phase: 'orchestration' });
        await this.processVideoUpload({ gameId, filePath, userId });
    }

    private async processVideoUpload(message: PubSubMessage): Promise<void> {
        const { gameId, filePath, userId } = message;
        let localVideoPath = filePath;
        let savedJob: VideoAnalysisJob;

        const existingJob = await this.jobRepository.findExistingJob(gameId, filePath);
        if (existingJob) {
            this.jobLogger.info(`[ORCHESTRATOR] Found existing job ${existingJob.id} for game ${gameId}. Status: ${existingJob.status}`, { phase: 'orchestration' });
            
            if (existingJob.status === VideoAnalysisJobStatus.COMPLETED) {
                this.jobLogger.info(`[ORCHESTRATOR] Job already COMPLETED. Skipping.`, { phase: 'orchestration' });
                return;
            }
            
            // If it's PROCESSING or PENDING, but we got a task (retry), allow it to continue
            savedJob = existingJob;
            this.jobLogger.info(`[ORCHESTRATOR] Resuming/Restarting orchestration for job ${savedJob.id}`, { phase: 'orchestration' });
        } else {
            const job = new VideoAnalysisJob();
            job.gameId = gameId;
            job.filePath = filePath;
            job.userId = userId;
            job.status = VideoAnalysisJobStatus.PENDING;
            savedJob = await this.jobRepository.create(job);
            this.jobLogger.info(`[SLICER_START] 🔪 Starting orchestration | Job: ${savedJob.id} | Game: ${gameId}`, { phase: 'orchestration' });
        }

        try {
            await this.jobRepository.update(savedJob.id, { 
                status: VideoAnalysisJobStatus.CHUNKING,
                processingHeartbeatAt: new Date()
            });
            
            // 1. Download from GCS if needed
            if (filePath.startsWith('gs://')) {
                const tempBaseDir = process.env.WORKER_TEMP_DIR || '/tmp/statvision';
                const workerJobDir = path.join(tempBaseDir, savedJob.id);
                if (!fs.existsSync(workerJobDir)) {
                    fs.mkdirSync(workerJobDir, { recursive: true });
                }

                const fileName = path.basename(filePath);
                localVideoPath = path.join(workerJobDir, fileName);
                
                // Parse GCS URI: gs://bucket/path/to/file
                const parts = filePath.replace('gs://', '').split('/');
                // const bucketName = parts[0]; // Provider already has bucket
                const remotePath = parts.slice(1).join('/');

                this.jobLogger.info(`[ORCHESTRATOR] Downloading ${filePath} to ${localVideoPath}...`, { phase: 'orchestration' });
                try {
                    await this.storageProvider.downloadFile(remotePath, localVideoPath);
                    this.jobLogger.info(`[ORCHESTRATOR] Download successful: ${localVideoPath}`, { phase: 'orchestration' });
                } catch (dlError: any) {
                    this.jobLogger.error(`[ORCHESTRATOR] GCS Download failed for ${filePath}`, { 
                        error: dlError.message, 
                        stack: dlError.stack,
                        code: dlError.code,
                        phase: 'orchestration' 
                    });
                    throw dlError;
                }
            }

            // Initial progress setup (estimated total chunks, will be updated after metadata)
            await this.progressManager.addJob(savedJob.id, 100, gameId);
            await this.progressManager.updateDetails(savedJob.id, 'Initializing chunking...', 'CHUNKING');

            const existingChunks = await this.chunkRepository.findByJobId(savedJob.id);
            const startSequence = existingChunks.length;
            if (startSequence > 0) {
                this.jobLogger.info(`[ORCHESTRATOR] Resuming chunking for job ${savedJob.id} from sequence ${startSequence}`, { phase: 'orchestration' });
            }

            const tempDir = path.dirname(localVideoPath);
            const chunkingMode = workerConfig.chunkingMode;
            this.jobLogger.info(`[ORCHESTRATOR] Starting chunking for job ${savedJob.id} in ${chunkingMode} mode`, { phase: 'orchestration' });

            let chunks: VideoChunk[] = [];
            let totalChunks = 0;

            if (chunkingMode === 'VIRTUAL') {
                const result = await this.videoChunkerService.generateVirtualChunks(
                    localVideoPath,
                    workerConfig.chunkDurationSeconds,
                    workerConfig.chunkOverlapSeconds,
                    startSequence
                );
                chunks = result.chunks;
                totalChunks = result.totalChunks;
            } else {
                const result = await this.videoChunkerService.chunkVideo(
                    localVideoPath, 
                    tempDir, 
                    workerConfig.chunkDurationSeconds, 
                    workerConfig.chunkOverlapSeconds, 
                    savedJob.id,
                    this.progressManager,
                    startSequence
                );
                chunks = result.chunks;
                totalChunks = result.totalChunks;
            }

            this.jobLogger.info(`[SLICER_SUCCESS] 📁 Video segmented into ${chunks.length} new chunks | Total: ${totalChunks} | Job: ${savedJob.id} | Mode: ${chunkingMode}`, { 
                phase: 'orchestration',
                newChunksCount: chunks.length,
                totalChunks,
                mode: chunkingMode
            });

            await this.progressManager.setTotalChunks(savedJob.id, totalChunks);

            for (const chunkData of chunks) {
                let storageUri = chunkData.chunkPath;

                // Only upload if it's a physical local chunk (not VIRTUAL mode)
                if (chunkingMode !== 'VIRTUAL') {
                    const fileName = path.basename(chunkData.chunkPath);
                    const destinationPath = `chunks/${savedJob.id}/${fileName}`;
                    this.jobLogger.info(`[ORCHESTRATOR] Uploading chunk ${chunkData.sequence} to storage...`, { phase: 'orchestration' });
                    storageUri = await this.storageProvider.uploadFile(chunkData.chunkPath, destinationPath);
                    
                    // Cleanup local physical chunk file
                    try {
                        fs.unlinkSync(chunkData.chunkPath);
                    } catch (err) {
                        this.jobLogger.warn(`[ORCHESTRATOR] Failed to cleanup local chunk ${chunkData.chunkPath}`, { error: err });
                    }
                } else {
                    // In VIRTUAL mode, storageUri is already the source path (GCS or local)
                    // We prefer the original GCS path if it was a GCS upload
                    storageUri = filePath;
                }

                const chunk = new Chunk();
                chunk.jobId = savedJob.id;
                chunk.chunkPath = storageUri;
                chunk.startTime = chunkData.startTime;
                chunk.endTime = chunkData.endTime;
                chunk.sequence = chunkData.sequence;
                chunk.status = ChunkStatus.PENDING;
                await this.chunkRepository.create(chunk);
            }

            // Update with actual chunk count
            await this.jobRepository.update(savedJob.id, { 
                totalChunks,
                status: VideoAnalysisJobStatus.ANALYZING,
                processingHeartbeatAt: new Date()
            });
            await this.gameRepository.update(gameId, { totalChunks });
            
            await this.progressManager.updateJob(savedJob.id, startSequence + chunks.length, 'Chunking complete. Starting analysis.', 'ANALYZING');

            // Queue all chunks that need analysis (including those that were already there)
            const allChunksForJob = await this.chunkRepository.findByJobId(savedJob.id);
            const chunkIdsToAnalyze = allChunksForJob
                .filter(c => c.status === ChunkStatus.PENDING || c.status === ChunkStatus.FAILED)
                .map(c => c.id);

            if (chunkIdsToAnalyze.length > 0) {
                await this.queueChunksForAnalysis(savedJob.id, chunkIdsToAnalyze);
            } else {
                // If all chunks are already completed or being processed, try to finalize the job
                this.jobLogger.info(`[ORCHESTRATOR] All chunks for job ${savedJob.id} are already being handled. Triggering finalization check.`, { phase: 'orchestration' });
                await this.jobFinalizerService.finalizeJob(savedJob.id);
            }

            // Cleanup local source video if it was downloaded
            if (filePath.startsWith('gs://') && fs.existsSync(localVideoPath)) {
                fs.unlinkSync(localVideoPath);
            }

        } catch (error: any) {
            this.jobLogger.error(`[SLICER_FAILURE] ❌ Orchestration failed for job ${savedJob.id}: ${error.message}`, { 
                error: error.stack, 
                phase: 'orchestration' 
            });
            await this.jobRepository.update(savedJob.id, { 
                status: VideoAnalysisJobStatus.FAILED,
                failureReason: error.message 
            });
            throw error;
        }
    }

    private async triggerAnalysisTask(jobId: string, chunkId: string): Promise<void> {
        const payload = { jobId, chunkId };
        
        // 1. LOCAL DEVELOPMENT FALLBACK
        if (process.env.NODE_ENV !== 'production' || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            this.jobLogger.info(`[LOCAL] Bypassing Cloud Tasks. Triggering analyzer via HTTP fallback.`);
            try {
                const fetch = (await import('node-fetch')).default;
                const response = await fetch(workerConfig.analyzerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    this.jobLogger.info(`Successfully triggered local analyzer for chunk: ${chunkId}`);
                    return;
                } else {
                    const text = await response.text();
                    this.jobLogger.warn(`Local analyzer trigger failed: ${text}`);
                }
            } catch (err) {
                this.jobLogger.error(`Failed to trigger local analyzer directly:`, err);
            }

            if (process.env.NODE_ENV !== 'production') return;
        }

        // 2. PRODUCTION CLOUD TASKS
        const parent = this.tasksClient.queuePath(
            workerConfig.cloudTasksProjectId,
            workerConfig.cloudTasksLocation,
            workerConfig.cloudTasksQueueName
        );

        const task = {
            dispatchTimeout: { seconds: 600 },
            httpRequest: {
                httpMethod: 'POST' as const,
                url: workerConfig.analyzerUrl,
                headers: { 'Content-Type': 'application/json' },
                body: Buffer.from(JSON.stringify(payload)).toString('base64'),
                oidcToken: {
                    serviceAccountEmail: '515511056475-compute@developer.gserviceaccount.com',
                },
            },
        };

        try {
            await this.tasksClient.createTask({ parent, task });
            this.jobLogger.debug(`[ORCHESTRATOR] Created analysis task for chunk ${chunkId}`, { phase: 'orchestration' });
        } catch (error: any) {
            this.jobLogger.error(`[ORCHESTRATOR] Failed to create Cloud Task`, { error, phase: 'orchestration' });
            if (process.env.NODE_ENV === 'production') throw error;
        }
    }

    private async queueChunksForAnalysis(jobId: string, chunkIds: string[]): Promise<void> {
        if (chunkIds.length === 0) return;

        // ANALYSIS IS ALWAYS SEQUENTIAL (Multi-turn requirement)
        // We only queue the FIRST chunk. Subsequent chunks are triggered by the worker upon completion.
        const firstChunkId = chunkIds[0];
        this.jobLogger.info(`[ORCHESTRATOR] Initiating SEQUENTIAL analysis chain for Job ${jobId}. Starting with chunk ${firstChunkId}`, { phase: 'orchestration' });
        
        await this.triggerAnalysisTask(jobId, firstChunkId);
    }

    public async checkExistingJobsOnStartup(): Promise<void> {
        this.jobLogger.info('[ORCHESTRATOR] Checking for existing PENDING or PROCESSING jobs...', { phase: 'orchestration' });
        const jobs = await this.jobRepository.find({
            where: [
                { status: VideoAnalysisJobStatus.PENDING },
                { status: VideoAnalysisJobStatus.PROCESSING }
            ]
        });

        for (const job of jobs) {
            this.jobLogger.info(`[ORCHESTRATOR] Resuming/Restarting job ${job.id} for game ${job.gameId}`, { phase: 'orchestration' });
            
            const chunks = await this.chunkRepository.findByJobId(job.id);
            if (chunks.length === 0) {
                 await this.processVideoUpload({ gameId: job.gameId, filePath: job.filePath, userId: job.userId });
            } else {
                await this.progressManager.addJob(job.id, chunks.length, job.gameId);
                const completedCount = chunks.filter(c => c.status === ChunkStatus.COMPLETED).length;
                if (completedCount > 0) {
                    await this.progressManager.updateJob(job.id, completedCount, `Resuming: ${completedCount}/${chunks.length} complete`, 'RESUMING');
                }

                const pendingChunkIds = chunks
                    .filter(c => c.status === ChunkStatus.PENDING || c.status === ChunkStatus.FAILED)
                    .sort((a, b) => a.sequence - b.sequence)
                    .map(c => c.id);
                
                if (pendingChunkIds.length > 0) {
                    this.jobLogger.info(`[ORCHESTRATOR] Resuming SEQUENTIAL analysis chain for job ${job.id}.`, { phase: 'orchestration' });
                    await this.queueChunksForAnalysis(job.id, [pendingChunkIds[0]]);
                }
            }
        }
        this.jobLogger.info('[ORCHESTRATOR] Finished checking and re-orchestrating existing jobs.', { phase: 'orchestration' });
    }
}
