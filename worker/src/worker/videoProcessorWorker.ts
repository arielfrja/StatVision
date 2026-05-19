import { Message, SubscriptionOptions } from '@google-cloud/pubsub';
import { workerConfig } from '../config/workerConfig';
import { 
    VideoAnalysisJob, VideoAnalysisJobStatus, 
    Chunk, ChunkStatus, IEventBus, IStorageProvider
} from '@statvision/common';
import { VideoAnalysisJobRepository } from './VideoAnalysisJobRepository';
import { VideoChunkerService, VideoChunk } from './VideoChunkerService';
import { ProgressManager } from './ProgressManager';
import { jobLogger, chunkLogger } from '../config/loggers';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource } from 'typeorm';
import { ChunkRepository } from './ChunkRepository';

const VIDEO_UPLOAD_SUBSCRIPTION_NAME = process.env.VIDEO_UPLOAD_SUBSCRIPTION_NAME || 'video-upload-events-sub';
const CHUNK_ANALYSIS_TOPIC_NAME = process.env.CHUNK_ANALYSIS_TOPIC_NAME || 'chunk-analysis';

interface PubSubMessage {
    gameId: string;
    filePath: string;
    userId: string;
}

export class VideoOrchestratorService {
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private videoChunkerService: VideoChunkerService;
    private jobLogger = jobLogger;
    private chunkLogger = chunkLogger;
    private processingMode: string;

    constructor(
        private dataSource: DataSource, 
        private eventBus: IEventBus,
        private progressManager: ProgressManager,
        private storageProvider: IStorageProvider
    ) {
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.videoChunkerService = new VideoChunkerService();
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

    private async processVideoUpload(message: PubSubMessage): Promise<void> {
        const { gameId, filePath, userId } = message;
        let localVideoPath = filePath;

        const existingJob = await this.jobRepository.findExistingJob(gameId, filePath);
        if (existingJob) {
            this.jobLogger.info(`[ORCHESTRATOR] Job already exists for game ${gameId} and file ${filePath}. Status: ${existingJob.status}`, { phase: 'orchestration' });
            if (existingJob.status === VideoAnalysisJobStatus.COMPLETED) return; 
            if (existingJob.status === VideoAnalysisJobStatus.PROCESSING || existingJob.status === VideoAnalysisJobStatus.PENDING) return; 
        }

        const job = new VideoAnalysisJob();
        job.gameId = gameId;
        job.filePath = filePath;
        job.userId = userId;
        job.status = VideoAnalysisJobStatus.PENDING;
        
        const savedJob = await this.jobRepository.create(job);
        this.jobLogger.info(`[ORCHESTRATOR] Created new VideoAnalysisJob: ${savedJob.id}`, { phase: 'orchestration' });

        try {
            await this.jobRepository.update(savedJob.id, { status: VideoAnalysisJobStatus.PROCESSING });
            
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

            const tempDir = path.dirname(localVideoPath);
            const chunks = await this.videoChunkerService.chunkVideo(
                localVideoPath, 
                tempDir, 
                workerConfig.chunkDurationSeconds, 
                workerConfig.chunkOverlapSeconds, 
                savedJob.id,
                this.progressManager
            );
            this.jobLogger.info(`[ORCHESTRATOR] Split video into ${chunks.length} chunks.`, { phase: 'orchestration' });

            await this.progressManager.setTotalChunks(savedJob.id, chunks.length);

            const savedChunks = [];
            for (const chunkData of chunks) {
                const chunk = new Chunk();
                chunk.jobId = savedJob.id;
                chunk.chunkPath = chunkData.chunkPath;
                chunk.startTime = chunkData.startTime;
                chunk.sequence = chunkData.sequence;
                chunk.status = ChunkStatus.PENDING;
                savedChunks.push(await this.chunkRepository.create(chunk));
            }

            // Update with actual chunk count
            await this.progressManager.updateJob(savedJob.id, 0, 'Chunking complete. Starting analysis.', 'ANALYZING');

            for (const chunk of savedChunks) {
                await this.eventBus.publish(CHUNK_ANALYSIS_TOPIC_NAME, {
                    jobId: savedJob.id,
                    chunkId: chunk.id
                });
                this.jobLogger.debug(`[ORCHESTRATOR] Published analysis request for chunk ${chunk.sequence}`, { phase: 'orchestration' });
            }

            // Cleanup local source video if it was downloaded
            if (filePath.startsWith('gs://') && fs.existsSync(localVideoPath)) {
                fs.unlinkSync(localVideoPath);
            }

        } catch (error: any) {
            this.jobLogger.error(`[ORCHESTRATOR] Orchestration failed for job ${savedJob.id}`, { error, phase: 'orchestration' });
            await this.jobRepository.update(savedJob.id, { 
                status: VideoAnalysisJobStatus.FAILED,
                failureReason: error.message 
            });
            throw error;
        }
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

                for (const chunk of chunks) {
                    if (chunk.status === ChunkStatus.PENDING || chunk.status === ChunkStatus.FAILED) {
                        await this.eventBus.publish(CHUNK_ANALYSIS_TOPIC_NAME, {
                            jobId: job.id,
                            chunkId: chunk.id
                        });
                    }
                }
            }
        }
        this.jobLogger.info('[ORCHESTRATOR] Finished checking and re-orchestrating existing jobs.', { phase: 'orchestration' });
    }
}
