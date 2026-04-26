import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
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
import { VideoAnalysisJobStatus } from '@statvision/common';
import { JobFinalizerService } from './worker/JobFinalizerService';
import { workerConfig } from './config/workerConfig';

import express from 'express';

async function main() {
    try {
        console.log("Initializing Data Source...");
        await AppDataSource.initialize();
        console.log("Data Source initialized.");
        
        // --- Cloud Run Health Check Server ---
        const app = express();
        const port = process.env.WORKER_PORT || process.env.PORT || 8080;
        
        app.get('/health', (req, res) => {
            res.status(200).send('OK');
        });

        console.log(`Starting health check server on port ${port}...`);
        app.listen(port, () => {
            console.log(`Health check server listening on port ${port}`);
        });
        // -------------------------------------

        console.log("Getting container instance...");
        const container = AppContainer.getInstance(AppDataSource);
        console.log("Container instance obtained.");

        // --- Startup Reconciliation ---
        console.log("Starting reconciliation...");
        const jobRepository = container.get<VideoAnalysisJobRepository>("VideoAnalysisJobRepository");
        const jobFinalizer = container.get<JobFinalizerService>(JobFinalizerService);

        const jobsToReconcile = await jobRepository.find({
            where: {
                status: In([VideoAnalysisJobStatus.PROCESSING, VideoAnalysisJobStatus.RETRYABLE_FAILED])
            }
        });

        if (jobsToReconcile.length > 0) {
            console.log(`Found ${jobsToReconcile.length} jobs to reconcile.`);
            for (const job of jobsToReconcile) {
                await jobFinalizer.finalizeJob(job.id);
            }
            console.log(`Reconciliation complete.`);
        } else {
            console.log(`No jobs found needing reconciliation.`);
        }
        // --- End of Startup Reconciliation ---

        console.log("Starting workers...");
        const videoOrchestratorService = container.get<VideoOrchestratorService>(VideoOrchestratorService);
        videoOrchestratorService.startConsumingMessages();

        const chunkProcessorWorker = container.get<ChunkProcessorWorker>(ChunkProcessorWorker);
        chunkProcessorWorker.startConsumingMessages();

        const videoAnalysisResultService = container.get<VideoAnalysisResultService>(VideoAnalysisResultService);
        videoAnalysisResultService.startConsumingResults();
        
        console.log("All services started.");
    } catch (error) {
        console.error("FATAL ERROR IN WORKER MAIN:", error);
        throw error;
    }
}

main().catch((err) => {
    jobLogger.error("Error during worker startup:", err);
    process.exit(1);
});
