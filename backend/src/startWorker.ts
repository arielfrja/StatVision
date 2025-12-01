import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.worker file
const envPath = path.resolve(__dirname, '../.env.worker');
dotenv.config({ path: envPath });

import "reflect-metadata";
import { In } from "typeorm";
import { AppDataSource } from "./data-source";
import { jobLogger } from "./config/loggers";
import { VideoOrchestratorService } from "./worker/videoProcessorWorker";
import { ChunkProcessorWorker } from "./worker/ChunkProcessorWorker";
import { VideoAnalysisResultService } from "./service/VideoAnalysisResultService";
import { VideoAnalysisJobRepository } from './worker/VideoAnalysisJobRepository';
import { VideoAnalysisJobStatus } from './worker/VideoAnalysisJob';
import { JobFinalizerService } from './worker/JobFinalizerService';
import { workerConfig } from './config/workerConfig';
import { GameEventRepository } from './repository/GameEventRepository';
import { PlayerRepository } from './repository/PlayerRepository';
import { TeamRepository } from './repository/TeamRepository';
import { GameEvent } from './GameEvent';
import { Player } from './Player';
import { Team } from './Team';

async function main() {
    await AppDataSource.initialize();
    jobLogger.info("Data Source has been initialized for worker!");

    // --- Startup Reconciliation ---
    jobLogger.info("[Startup] Starting reconciliation for jobs in intermediate states...");
    const jobRepository = new VideoAnalysisJobRepository(AppDataSource);
    const jobFinalizer = new JobFinalizerService(AppDataSource);

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

    const videoOrchestratorService = new VideoOrchestratorService(AppDataSource);
    videoOrchestratorService.startConsumingMessages();

    // Instantiate Repositories for ChunkProcessorWorker
    const gameEventRepository = new GameEventRepository(AppDataSource);
    const playerRepository = new PlayerRepository(AppDataSource);
    const teamRepository = new TeamRepository(AppDataSource.getRepository(Team)); // TeamRepository needs base TypeORM repo

    const chunkProcessorWorker = new ChunkProcessorWorker(
        AppDataSource,
        gameEventRepository,
        playerRepository,
        teamRepository
    );
    chunkProcessorWorker.startConsumingMessages();

    const videoAnalysisResultService = new VideoAnalysisResultService(AppDataSource, jobLogger);
    videoAnalysisResultService.startConsumingResults();
}

main().catch((err) => {
    jobLogger.error("Error during worker startup:", err);
    process.exit(1);
});
