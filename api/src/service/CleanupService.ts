import { IStorageProvider } from "@statvision/common";
import logger from "../config/logger";

export class CleanupService {
    constructor(private storageProvider: IStorageProvider) {}

    /**
     * Cleans up all GCS artifacts associated with a job.
     * This includes temporary video segments (chunks).
     */
    public async cleanupJobArtifacts(jobId: string): Promise<void> {
        const prefix = `chunks/${jobId}/`;
        logger.info(`[CleanupService] Purging artifacts for job ${jobId} (Prefix: ${prefix})`);

        try {
            await this.storageProvider.deleteFilesByPrefix(prefix);
            logger.info(`[CleanupService] Successfully purged artifacts for job ${jobId}`);
        } catch (error: any) {
            // We log but don't throw, as cleanup failure shouldn't crash the main process.
            logger.warn(`[CleanupService] Failed to purge artifacts for job ${jobId}: ${error.message}`);
        }
    }
}
