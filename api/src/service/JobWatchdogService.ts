import { DataSource, LessThan, Not, In } from "typeorm";
import { VideoAnalysisJob, VideoAnalysisJobStatus, Game, GameStatus } from "@statvision/common";
import logger from "../config/logger";
import { NotificationService } from "./NotificationService";

export class JobWatchdogService {
    private jobRepository;
    private gameRepository;

    constructor(
        private dataSource: DataSource,
        private notificationService: NotificationService
    ) {
        this.jobRepository = this.dataSource.getRepository(VideoAnalysisJob);
        this.gameRepository = this.dataSource.getRepository(Game);
    }

    /**
     * Checks for jobs that have been stuck in a non-terminal state for too long.
     * Stale jobs are marked as FAILED.
     */
    async checkStaleJobs(): Promise<{ checked: number; failed: number }> {
        const STALE_THRESHOLD_MINUTES = 15;
        const staleDate = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

        logger.info(`[WATCHDOG] Checking for jobs older than ${staleDate.toISOString()}`);

        const staleJobs = await this.jobRepository.find({
            where: {
                status: Not(In([VideoAnalysisJobStatus.COMPLETED, VideoAnalysisJobStatus.FAILED, VideoAnalysisJobStatus.FINALIZING])),
                processingHeartbeatAt: LessThan(staleDate)
            }
        });

        // Don't kill jobs that have all chunks completed — they're waiting for finalization, not stuck
        const killableJobs = staleJobs.filter(job =>
            !(job.totalChunks > 0 && job.totalChunks === job.completedChunks)
        );

        if (killableJobs.length === 0) {
            logger.info(staleJobs.length > 0
                ? `[WATCHDOG] ${staleJobs.length} stale job(s) have all chunks completed — skipping (pending finalization).`
                : `[WATCHDOG] No stale jobs found.`);
            return { checked: staleJobs.length, failed: 0 };
        }

        logger.warn(`[WATCHDOG] Found ${killableJobs.length} truly stale jobs (${staleJobs.length - killableJobs.length} have all chunks completed). Marking as FAILED.`);

        let failedCount = 0;
        for (const job of killableJobs) {
            try {
                const failureReason = `Job timed out. No heartbeat received for over ${STALE_THRESHOLD_MINUTES} minutes.`;

                await this.dataSource.transaction(async (manager) => {
                    // Update Job
                    await manager.update(VideoAnalysisJob, job.id, {
                        status: VideoAnalysisJobStatus.FAILED,
                        failureReason: failureReason
                    });

                    // Update Game
                    await manager.update(Game, job.gameId, {
                        status: GameStatus.FAILED
                    });
                });

                // Sync failure to Firebase so user is notified
                await this.notificationService.updateJobProgress(job.id, {
                    progress: 0,
                    status: 'FAILED',
                    details: failureReason,
                    gameId: job.gameId
                });

                logger.info(`[WATCHDOG] Job ${job.id} (Game ${job.gameId}) marked as FAILED.`);
                failedCount++;
            } catch (error) {
                logger.error(`[WATCHDOG] Failed to update stale job ${job.id}:`, error);
            }
        }

        return { checked: staleJobs.length, failed: failedCount };
    }
}
