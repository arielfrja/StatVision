import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.worker file
const envPath = path.resolve(__dirname, '../.env.worker');
dotenv.config({ path: envPath });

import "reflect-metadata";
import { In } from "typeorm";
import { AppDataSource } from "./data-source";
import { jobLogger } from "./config/loggers";
import { AppContainer } from "./shared/AppContainer";
import { VideoOrchestratorService } from "./worker/videoProcessorWorker";
import { ChunkProcessorWorker } from "./worker/ChunkProcessorWorker";
import { VideoAnalysisResultService } from "./service/VideoAnalysisResultService";
import { VideoAnalysisJobRepository } from './worker/VideoAnalysisJobRepository';
import { VideoAnalysisJobStatus } from './core/entities/VideoAnalysisJob';
import { JobFinalizerService } from './worker/JobFinalizerService';
import { workerConfig } from './config/workerConfig';

async function main() {
    await AppDataSource.initialize();
    jobLogger.info("Data Source has been initialized for worker!");

    const container = AppContainer.getInstance(AppDataSource);

    // --- Startup Reconciliation ---
    jobLogger.info("[Startup] Starting reconciliation for jobs in intermediate states...");
    const jobRepository = container.get<VideoAnalysisJobRepository>("VideoAnalysisJobRepository");
    const jobFinalizer = container.get<JobFinalizerService>(JobFinalizerService);

    const jobsToReconcile = await jobRepository.find({
        where: {
            status: In([VideoAnalysisJobStatus.PROCESSING, VideoAnalysisJobStatus.RETRYABLE_FAILED])
        }
    });

    if (jobsToReconcile.length > 0) {
        jobLogger.info(`[Startup] Found ${jobsToReconcile.length} jobs to reconcile.`);
        for (const job of jobsToReconcile) {
            await jobFinalizer.finalizeJob(job.id);
        }
        jobLogger.info(`[Startup] Reconciliation complete.`);
    } else {
        jobLogger.info(`[Startup] No jobs found needing reconciliation.`);
    }
    // --- End of Startup Reconciliation ---

    jobLogger.info(`[Startup] Starting workers in ${workerConfig.processingMode} mode.`);

    const videoOrchestratorService = container.get<VideoOrchestratorService>(VideoOrchestratorService);
    videoOrchestratorService.startConsumingMessages();

    const chunkProcessorWorker = container.get<ChunkProcessorWorker>(ChunkProcessorWorker);
    chunkProcessorWorker.startConsumingMessages();

    const videoAnalysisResultService = container.get<VideoAnalysisResultService>(VideoAnalysisResultService);
    videoAnalysisResultService.startConsumingResults();
}

main().catch((err) => {
    jobLogger.error("Error during worker startup:", err);
    process.exit(1);
});
