import { DataSource, LessThan } from "typeorm";
import { VideoAnalysisJob, VideoAnalysisJobStatus } from "./VideoAnalysisJob";
import { VideoAnalysisJobRepository } from "./VideoAnalysisJobRepository";
import { jobLogger as logger } from "../config/loggers";

export async function cleanupStuckJobs(dataSource: DataSource) {
    const jobRepository = new VideoAnalysisJobRepository(dataSource);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    logger.info("[JANITOR] Checking for stuck jobs...", { phase: 'janitor' });

    const stuckJobs = await jobRepository.find({
        where: {
            status: VideoAnalysisJobStatus.PROCESSING,
            processingHeartbeatAt: LessThan(fiveMinutesAgo)
        }
    });

    if (stuckJobs.length === 0) {
        logger.info("[JANITOR] No stuck jobs found.", { phase: 'janitor' });
        return;
    }

    logger.warn(`[JANITOR] Found ${stuckJobs.length} stuck jobs. Resetting...`, { phase: 'janitor' });
    for (const job of stuckJobs) {
        try {
            logger.warn(`[JANITOR] Resetting job ${job.id}. It was last seen at ${job.processingHeartbeatAt}.`, { jobId: job.id, phase: 'janitor' });
            await jobRepository.update(job.id, {
                status: VideoAnalysisJobStatus.RETRYABLE_FAILED, // Or FAILED based on retryCount
                failureReason: `Job marked as failed by janitor due to being stuck in processing since ${job.processingHeartbeatAt}.`
            });
        } catch (error: any) {
            logger.error(`[JANITOR] Failed to reset stuck job ${job.id}.`, {
                error: {
                    message: error.message,
                    stack: error.stack,
                    jobId: job.id,
                },
                phase: 'janitor'
            });
        }
    }
}
