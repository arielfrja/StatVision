import { ProgressManager } from './ProgressManager';
import { DataSource } from "typeorm";
import { VideoAnalysisJob, VideoAnalysisJobStatus } from "../core/entities/VideoAnalysisJob";
import { VideoAnalysisJobRepository } from "./VideoAnalysisJobRepository";
import { ChunkRepository } from "./ChunkRepository";
import { ChunkStatus } from "../core/entities/Chunk";
import { jobLogger } from '../config/loggers';
import { VideoChunkerService } from "./VideoChunkerService";
import { IEventBus } from '../core/interfaces/IEventBus';

const VIDEO_ANALYSIS_RESULTS_TOPIC_NAME = process.env.VIDEO_ANALYSIS_RESULTS_TOPIC_NAME || 'video-analysis-results';

export class JobFinalizerService {
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private videoChunkerService: VideoChunkerService;
    private logger = jobLogger;

    constructor(private dataSource: DataSource, private eventBus: IEventBus) {
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
            this.logger.warn(`[JobFinalizerService] Marking job ${jobId} as FAILED due to failed chunks. Details: ${failureReason}`, { phase: 'finalizing' });
        }
        // Rule 2: If all chunks are completed, the job is COMPLETED.
        else if (completedChunks === totalChunks) {
            finalStatus = VideoAnalysisJobStatus.COMPLETED;
            this.logger.info(`[JobFinalizerService] Marking job ${jobId} as COMPLETED.`, { phase: 'finalizing' });
        }

        if (finalStatus) {
            await this.dataSource.transaction(async (transactionalEntityManager) => {
                const currentStatus = finalStatus!;
                const allEvents: any[] = [];
                let allPlayers: any[] = [];
                let allTeams: any[] = [];

                if (currentStatus === VideoAnalysisJobStatus.COMPLETED) {
                    // Merge data from all chunks
                    const playerMap = new Map<string, any>();
                    const teamMap = new Map<string, any>();

                    // Sort chunks by sequence to ensure consistent merging
                    const sortedChunks = chunks.sort((a, b) => a.sequence - b.sequence);

                    for (const chunk of sortedChunks) {
                        // Merge Players
                        if (chunk.identifiedPlayers) {
                            for (const p of chunk.identifiedPlayers) {
                                playerMap.set(p.id, p);
                            }
                        }
                        // Merge Teams
                        if (chunk.identifiedTeams) {
                            for (const t of chunk.identifiedTeams) {
                                teamMap.set(t.id, t);
                            }
                        }
                        // Aggregate events from all chunks (Authoritative Window ensures no duplicates)
                        if (chunk.processedEvents) {
                            allEvents.push(...chunk.processedEvents);
                        }
                    }
                    allPlayers = Array.from(playerMap.values());
                    allTeams = Array.from(teamMap.values());
                }

                // Update the job with aggregated results
                await transactionalEntityManager.update(VideoAnalysisJob, jobId, {
                    status: currentStatus,
                    failureReason,
                    processedEvents: allEvents.length > 0 ? allEvents : null,
                    identifiedPlayers: allPlayers.length > 0 ? allPlayers : null,
                    identifiedTeams: allTeams.length > 0 ? allTeams : null,
                });
            });

            ProgressManager.getInstance().removeJob(jobId);

            // Fetch the updated job for Pub/Sub (after transaction)
            const updatedJob = await this.jobRepository.findOneById(jobId);

            // Publish the final result to the results topic
            try {
                const message = {
                    jobId: updatedJob?.id,
                    gameId: updatedJob?.gameId,
                    userId: updatedJob?.userId,
                    status: finalStatus,
                    failureReason: failureReason,
                    processedEvents: updatedJob?.processedEvents,
                    identifiedPlayers: updatedJob?.identifiedPlayers,
                    identifiedTeams: updatedJob?.identifiedTeams,
                };
                await this.eventBus.publish(VIDEO_ANALYSIS_RESULTS_TOPIC_NAME, message);
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
            }

            // Clean up only the chunk files that were successfully processed
            const completedChunks = chunks.filter(c => c.status === ChunkStatus.COMPLETED);
            const chunkPathsToClean = completedChunks.map(c => c.chunkPath);
            this.logger.info(`[JobFinalizerService] Cleaning up ${chunkPathsToClean.length} completed chunk files for job ${jobId}.`, { phase: 'finalizing' });
            await this.videoChunkerService.cleanupChunks(chunkPathsToClean);
        } else {
            this.logger.info(`[JobFinalizerService] Job ${jobId} is not yet in a terminal state. Waiting for more chunks to complete.`, { phase: 'finalizing' });
        }
    }
}
