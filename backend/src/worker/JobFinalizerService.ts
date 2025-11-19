import { ProgressManager } from './ProgressManager';
import { DataSource } from "typeorm";
import { VideoAnalysisJob, VideoAnalysisJobStatus } from "./VideoAnalysisJob";
import { VideoAnalysisJobRepository } from "./VideoAnalysisJobRepository";
import { ChunkRepository } from "./ChunkRepository";
import { ChunkStatus } from "./Chunk";
import { jobLogger } from '../config/loggers';
import { PubSub } from "@google-cloud/pubsub";
import { VideoChunkerService } from "./VideoChunkerService";

const VIDEO_ANALYSIS_RESULTS_TOPIC_NAME = process.env.VIDEO_ANALYSIS_RESULTS_TOPIC_NAME || 'video-analysis-results';

export class JobFinalizerService {
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private videoChunkerService: VideoChunkerService;
    private pubSubClient: PubSub;
    private logger = jobLogger;

    constructor(dataSource: DataSource) {
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.videoChunkerService = new VideoChunkerService();
        this.pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
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

        const totalChunks = chunks.length;
        const completedChunks = chunks.filter(c => c.status === ChunkStatus.COMPLETED).length;
        const failedChunks = chunks.filter(c => c.status === ChunkStatus.FAILED);

        this.logger.debug(`[JobFinalizerService] Job ${jobId} chunk status: ${completedChunks}/${totalChunks} completed, ${failedChunks.length}/${totalChunks} failed.`, { phase: 'finalizing' });

        let finalStatus: VideoAnalysisJobStatus | null = null;
        let failureReason: string | null = null;

        // Rule 1: If any chunk has failed, the entire job is marked as FAILED.
        if (failedChunks.length > 0) {
            finalStatus = VideoAnalysisJobStatus.FAILED;
            const failedChunkReasons = failedChunks.map(c => `Chunk ${c.sequence}: ${c.failureReason || 'Unknown reason'}`).join('\n');
            failureReason = `Job failed because ${failedChunks.length} out of ${totalChunks} chunk(s) failed processing.\nDetails:\n${failedChunkReasons}`;
            this.logger.warn(`[JobFinalizerService] Marking job ${jobId} as FAILED due to failed chunks.`, { phase: 'finalizing' });
        }
        // Rule 2: If all chunks are completed, the job is COMPLETED.
        else if (completedChunks === totalChunks) {
            finalStatus = VideoAnalysisJobStatus.COMPLETED;
            this.logger.info(`[JobFinalizerService] Marking job ${jobId} as COMPLETED.`, { phase: 'finalizing' });
        }

        if (finalStatus) {
            await this.jobRepository.update(jobId, { status: finalStatus, failureReason });
            ProgressManager.getInstance().removeJob(jobId);

            // Publish the final result to the results topic
            try {
                const resultsTopic = this.pubSubClient.topic(VIDEO_ANALYSIS_RESULTS_TOPIC_NAME);
                const message = {
                    jobId: job.id,
                    gameId: job.gameId,
                    status: finalStatus,
                    failureReason: failureReason,
                    processedEvents: finalStatus === VideoAnalysisJobStatus.COMPLETED ? job.processedEvents : null,
                };
                await resultsTopic.publishMessage({ json: message });
                this.logger.info(`[JobFinalizerService] Published final status '${finalStatus}' for job ${jobId} to topic ${VIDEO_ANALYSIS_RESULTS_TOPIC_NAME}.`, { phase: 'finalizing' });
            } catch (error: any) {
                this.logger.error(`[JobFinalizerService] Failed to publish final status for job ${jobId} to topic ${VIDEO_ANALYSIS_RESULTS_TOPIC_NAME}.`, {
                    error: {
                        message: error.message,
                        stack: error.stack,
                        jobId: jobId,
                    },
                    phase: 'finalizing'
                });
                // The job status is already updated in the DB, so we just log this error.
                // A retry mechanism for publishing could be added if it's critical.
            }

            // Clean up all chunk files associated with the job
            const chunkPaths = chunks.map(c => c.chunkPath);
            await this.videoChunkerService.cleanupChunks(chunkPaths);
        } else {
            this.logger.info(`[JobFinalizerService] Job ${jobId} is not yet in a terminal state. Waiting for more chunks to complete.`, { phase: 'finalizing' });
        }
    }
}
