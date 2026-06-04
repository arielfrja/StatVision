import { ProgressManager } from './ProgressManager';
import { DataSource } from "typeorm";
import { 
    VideoAnalysisJob, VideoAnalysisJobStatus, 
    IStorageProvider, IVideoIntelligenceProvider,
    Game, GameStatus 
} from "@statvision/common";
import { VideoAnalysisJobRepository } from "./VideoAnalysisJobRepository";
import { ChunkRepository } from "./ChunkRepository";
import { ChunkStatus } from "@statvision/common";
import { jobLogger } from '../config/loggers';
import { VideoChunkerService } from "./VideoChunkerService";
import { IEventBus } from '@statvision/common';
import { VideoAnalysisResultService } from '../service/VideoAnalysisResultService';
import * as fs from 'fs';
import * as path from 'path';

const VIDEO_ANALYSIS_RESULTS_TOPIC_NAME = process.env.VIDEO_ANALYSIS_RESULTS_TOPIC_NAME || 'video-analysis-results';

export class JobFinalizerService {
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private videoChunkerService: VideoChunkerService;
    private logger = jobLogger;

    constructor(
        private dataSource: DataSource, 
        private eventBus: IEventBus,
        private progressManager: ProgressManager,
        private storageProvider?: IStorageProvider,
        private videoAnalysisResultService?: VideoAnalysisResultService,
        private analysisProvider?: IVideoIntelligenceProvider
    ) {
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.videoChunkerService = new VideoChunkerService();
    }

    public async finalizeJob(jobId: string): Promise<void> {
        this.logger.info(`[JobFinalizerService] Checking final status for job ${jobId}`, { phase: 'finalizing' });

        const job = await this.jobRepository.findOneById(jobId);
        if (!job) {
            this.logger.error(`[JobFinalizerService] Job ${jobId} not found.`, { phase: 'finalizing' });
            return;
        }

        if (job.status === VideoAnalysisJobStatus.COMPLETED || job.status === VideoAnalysisJobStatus.FAILED) {
            this.logger.info(`[JobFinalizerService] Job ${jobId} is already in a terminal state: ${job.status}. No action needed.`, { phase: 'finalizing' });
            return;
        }

        const chunks = await this.chunkRepository.findByJobId(jobId);
        if (chunks.length === 0) {
            this.logger.warn(`[JobFinalizerService] No chunks found for job ${jobId}. Cannot determine final status yet.`, { phase: 'finalizing' });
            return;
        }

        // --- PREMATURE FINALIZATION GUARD ---
        // Ensure totalChunks has been set by the orchestrator
        if (!job.totalChunks || job.totalChunks === 0) {
            this.logger.info(`[JobFinalizerService] Orchestration not yet complete (totalChunks missing). Skipping finalization check.`, { phase: 'finalizing' });
            return;
        }

        const totalChunks = chunks.length;
        const completedChunks = chunks.filter(c => c.status === ChunkStatus.COMPLETED).length;
        const failedChunks = chunks.filter(c => c.status === ChunkStatus.FAILED);

        this.logger.debug(`[JobFinalizerService] Job ${jobId} status: ${completedChunks}/${job.totalChunks} chunks completed.`, { phase: 'finalizing' });

        let finalStatus: VideoAnalysisJobStatus | null = null;
        let failureReason: string | null = null;

        // Rule 1: If any chunk has failed, the entire job is marked as FAILED.
        if (failedChunks.length > 0) {
            finalStatus = VideoAnalysisJobStatus.FAILED;
            const failedChunkReasons = failedChunks.map(c => `Chunk ${c.sequence}: ${c.failureReason || 'Unknown reason'}`).join('\n');
            failureReason = `Job failed because ${failedChunks.length} chunk(s) failed processing.\nDetails:\n${failedChunkReasons}`;
            this.logger.warn(`[JobFinalizerService] Marking job ${jobId} as FAILED due to failed chunks.`, { phase: 'finalizing' });
        }
        // Rule 2: If all expected chunks are completed, the job is COMPLETED.
        else if (completedChunks === job.totalChunks) {
            finalStatus = VideoAnalysisJobStatus.COMPLETED;
            this.logger.info(`[JobFinalizerService] Marking job ${jobId} as COMPLETED. All ${job.totalChunks} chunks successful.`, { phase: 'finalizing' });
        }

        if (finalStatus) {
            // Update to FINALIZING state before long running persistence/aggregate logic
            await this.jobRepository.update(jobId, { 
                status: VideoAnalysisJobStatus.FINALIZING,
                processingHeartbeatAt: new Date()
            });

            // Aggregate all results for the final message
            const playerMap = new Map<string, any>();
            const teamMap = new Map<string, any>();
            const allEvents: any[] = [];
            const sortedChunks = chunks.sort((a, b) => a.sequence - b.sequence);

            for (const chunk of sortedChunks) {
                if (chunk.identifiedPlayers) {
                    for (const p of chunk.identifiedPlayers) playerMap.set(p.id, p);
                }
                if (chunk.identifiedTeams) {
                    for (const t of chunk.identifiedTeams) teamMap.set(t.id, t);
                }
                if (chunk.processedEvents) allEvents.push(...chunk.processedEvents);
            }

            const message = {
                jobId: job.id,
                gameId: job.gameId,
                userId: job.userId,
                status: finalStatus,
                failureReason: failureReason,
                processedEvents: allEvents,
                identifiedPlayers: Array.from(playerMap.values()),
                identifiedTeams: Array.from(teamMap.values()),
                isFinalResult: true
            } as any;

            // --- CONSOLIDATED PERSISTENCE CALL ---
            // This handles ID resolution, event upserting, and stats calculation
            if (this.videoAnalysisResultService) {
                await this.videoAnalysisResultService.handleFinalResult(message);
            }

            // Update Job Status
            await this.jobRepository.update(jobId, {
                status: finalStatus,
                failureReason,
                processedEvents: allEvents.length > 0 ? allEvents : null,
                identifiedPlayers: message.identifiedPlayers,
                identifiedTeams: message.identifiedTeams,
            });

            this.progressManager.removeJob(jobId);

            // Notify via Pub/Sub (for frontend/other services)
            await this.eventBus.publish(VIDEO_ANALYSIS_RESULTS_TOPIC_NAME, message);
            
            // Execute Cleanup Lifecycle
            await this.onJobFinal(jobId, finalStatus);

        } else {
            this.logger.info(`[JobFinalizerService] Job ${jobId} still in progress (${completedChunks}/${job.totalChunks}).`, { phase: 'finalizing' });
        }
    }

    private async onJobFinal(jobId: string, status: VideoAnalysisJobStatus): Promise<void> {
        this.logger.info(`[JOB_FINAL] 🏁 Starting total finalization for job ${jobId}`, { phase: 'finalizing' });

        try {
            const job = await this.jobRepository.findOneById(jobId);
            if (!job) return;

            // 1. Update Game Status (StatVision logic: COMPLETED -> ANALYZED happened in ResultService)
            // Here we just ensure terminal state in case ResultService missed it
            const gameRepository = this.dataSource.getRepository(Game);
            await gameRepository.update(job.gameId, { 
                status: status === VideoAnalysisJobStatus.COMPLETED ? GameStatus.ANALYZED : GameStatus.FAILED 
            });

            // 2. Resource Cleanup
            if (job.geminiFileName && this.analysisProvider) {
                await this.analysisProvider.deleteFile(job.geminiFileName).catch(() => {});
            }

            if (this.storageProvider && job.filePath.startsWith('gs://')) {
                const parts = job.filePath.split('/');
                const remotePath = parts.slice(3).join('/');
                await this.storageProvider.deleteFile(remotePath).catch(() => {});
            }

            const workerJobDir = path.join(process.env.WORKER_TEMP_DIR || '/tmp/statvision', jobId);
            if (fs.existsSync(workerJobDir)) {
                fs.rmSync(workerJobDir, { recursive: true, force: true });
            }

            this.logger.info(`[JOB_FINAL] ✅ Resources purged for job ${jobId}.`, { phase: 'finalizing' });

        } catch (error: any) {
            this.logger.error(`[JOB_FINAL] Error during finalization: ${error.message}`, { error, phase: 'finalizing' });
        }
    }
}
