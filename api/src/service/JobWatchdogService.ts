import { DataSource, LessThan, Not, In } from "typeorm";
import { VideoAnalysisJob, VideoAnalysisJobStatus, Game, GameStatus } from "@statvision/common";
import logger from "../config/logger";

export class JobWatchdogService {
    private jobRepository;
    private gameRepository;

    constructor(private dataSource: DataSource) {
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
                status: Not(In([VideoAnalysisJobStatus.COMPLETED, VideoAnalysisJobStatus.FAILED])),
                processingHeartbeatAt: LessThan(staleDate)
            }
        });

        if (staleJobs.length === 0) {
            logger.info(`[WATCHDOG] No stale jobs found.`);
            return { checked: 0, failed: 0 };
        }

        logger.warn(`[WATCHDOG] Found ${staleJobs.length} stale jobs. Marking as FAILED.`);

        let failedCount = 0;
        for (const job of staleJobs) {
            try {
                await this.dataSource.transaction(async (manager) => {
                    // Update Job
                    await manager.update(VideoAnalysisJob, job.id, {
                        status: VideoAnalysisJobStatus.FAILED,
                        failureReason: `Job timed out. No heartbeat received for over ${STALE_THRESHOLD_MINUTES} minutes.`
                    });

                    // Update Game
                    await manager.update(Game, job.gameId, {
                        status: GameStatus.FAILED
                    });
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
