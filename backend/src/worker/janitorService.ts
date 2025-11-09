import { DataSource, LessThan } from "typeorm";
import { VideoAnalysisJob, VideoAnalysisJobStatus } from "./VideoAnalysisJob";
import { VideoAnalysisJobRepository } from "./VideoAnalysisJobRepository";
import logger from "../config/logger";

export async function cleanupStuckJobs(dataSource: DataSource) {
    const jobRepository = new VideoAnalysisJobRepository(dataSource);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    logger.info("[JANITOR] Checking for stuck jobs...");

    const stuckJobs = await jobRepository.find({
        where: {
            status: VideoAnalysisJobStatus.PROCESSING,
            processingHeartbeatAt: LessThan(fiveMinutesAgo)
        }
    });

    if (stuckJobs.length === 0) {
        logger.info("[JANITOR] No stuck jobs found.");
        return;
    }

    logger.warn(`[JANITOR] Found ${stuckJobs.length} stuck jobs. Resetting...`);
    for (const job of stuckJobs) {
        logger.warn(`[JANITOR] Resetting job ${job.id}. It was last seen at ${job.processingHeartbeatAt}.`);
        job.status = VideoAnalysisJobStatus.RETRYABLE_FAILED; // Or FAILED based on retryCount
        await jobRepository.update(job.id, job);
    }
}
