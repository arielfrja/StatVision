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
import { ChunkRepository } from './worker/ChunkRepository';
import { VideoAnalysisJobStatus, ChunkStatus } from '@statvision/common';
import { JobFinalizerService } from './worker/JobFinalizerService';
import { workerConfig } from './config/workerConfig';

import express from 'express';

async function main() {
    try {
        console.log("Initializing Data Source...");
        await AppDataSource.initialize();
        console.log("Data Source initialized.");

        console.log("Getting container instance...");
        const container = AppContainer.getInstance(AppDataSource);
        console.log("Container instance obtained.");
        
        // --- Cloud Run Health Check & Cloud Tasks Server ---
        const app = express();
        const port = process.env.WORKER_PORT || process.env.PORT || 8080;
        
        app.get('/health', (req, res) => {
            res.status(200).send('OK');
        });

        // Cloud Tasks Push Endpoint
        app.post('/api/analyze-chunk', express.json(), async (req, res) => {
            try {
                const { jobId, chunkId } = req.body;
                if (!jobId || !chunkId) {
                    return res.status(400).send('Missing jobId or chunkId');
                }
                
                console.log(`[HTTP] Received analysis request for chunk ${chunkId} of job ${jobId}`);
                const chunkProcessorWorker = container.get<ChunkProcessorWorker>(ChunkProcessorWorker);
                await chunkProcessorWorker.analyzeChunk(jobId, chunkId);
                res.status(200).send('Chunk analyzed successfully');
            } catch (error: any) {
                console.error(`[HTTP] Error analyzing chunk:`, error);
                res.status(500).send(`Error: ${error.message}`);
            }
        });

        // Orchestration Push Endpoint
        app.post('/api/orchestrate-game', express.json(), async (req, res) => {
            try {
                const { gameId, filePath, userId } = req.body;
                if (!gameId || !filePath || !userId) {
                    return res.status(400).send('Missing gameId, filePath or userId');
                }
                
                console.log(`[HTTP] Received orchestration request for game ${gameId}`);
                const videoOrchestratorService = container.get<VideoOrchestratorService>(VideoOrchestratorService);
                await videoOrchestratorService.processVideo(gameId, filePath, userId);
                res.status(200).send('Orchestration started successfully');
            } catch (error: any) {
                console.error(`[HTTP] Error orchestrating game:`, error);
                res.status(500).send(`Error: ${error.message}`);
            }
        });

        console.log(`Starting worker server on port ${port}...`);
        app.listen(port, () => {
            console.log(`Worker server listening on port ${port}`);
        });
        // -------------------------------------

        // --- Startup Reconciliation ---
        console.log("Starting reconciliation...");
        const jobRepository = container.get<VideoAnalysisJobRepository>("VideoAnalysisJobRepository");
        const jobFinalizer = container.get<JobFinalizerService>(JobFinalizerService);
        const chunkProcessor = container.get<ChunkProcessorWorker>(ChunkProcessorWorker);
        const chunkRepository = container.get<ChunkRepository>("ChunkRepository");
        const orchestrator = container.get<VideoOrchestratorService>(VideoOrchestratorService);

        // Run high-level orchestrator check
        await orchestrator.checkExistingJobsOnStartup();

        const jobsToReconcile = await jobRepository.find({
            where: {
                status: In([VideoAnalysisJobStatus.PROCESSING, VideoAnalysisJobStatus.RETRYABLE_FAILED])
            }
        });

        if (jobsToReconcile.length > 0) {
            console.log(`Found ${jobsToReconcile.length} jobs to reconcile.`);
            for (const job of jobsToReconcile) {
                // 1. Check if job is actually finished
                await jobFinalizer.finalizeJob(job.id);

                // 2. If still processing, resume the chain
                const refreshedJob = await jobRepository.findOneById(job.id);
                if (refreshedJob && refreshedJob.status === VideoAnalysisJobStatus.PROCESSING) {
                    const allChunks = await chunkRepository.findByJobId(job.id);
                    const nextChunk = allChunks
                        .filter((c: any) => c.status === ChunkStatus.PENDING || c.status === ChunkStatus.FAILED)
                        .sort((a: any, b: any) => a.sequence - b.sequence)[0];
                    
                    if (nextChunk) {
                        console.log(`[RECONCILE] Resuming chain for job ${job.id}. Triggering chunk ${nextChunk.sequence}`);
                        // Use a short delay to ensure everything is initialized
                        setTimeout(() => {
                            chunkProcessor.analyzeChunk(job.id, nextChunk.id).catch(err => 
                                console.error(`[RECONCILE] Failed to trigger chunk ${nextChunk.id}:`, err)
                            );
                        }, 5000);
                    }
                }
            }
            console.log(`Reconciliation complete.`);
        } else {
            console.log(`No jobs found needing reconciliation.`);
        }
        // --- End of Startup Reconciliation ---

        console.log("Starting workers...");
        // NOTE: We are commenting out Pub/Sub pull consumers to allow Cloud Run to scale to zero.
        // Triggers now happen via Cloud Tasks push endpoints defined above.

        /*
        const videoOrchestratorService = container.get<VideoOrchestratorService>(VideoOrchestratorService);
        videoOrchestratorService.startConsumingMessages();

        const chunkProcessorWorker = container.get<ChunkProcessorWorker>(ChunkProcessorWorker);
        chunkProcessorWorker.startConsumingMessages();

        const videoAnalysisResultService = container.get<VideoAnalysisResultService>(VideoAnalysisResultService);
        videoAnalysisResultService.startConsumingResults();
        */
        
        console.log("Worker initialized in PUSH mode. Waiting for Cloud Tasks...");
    } catch (error) {
        console.error("FATAL ERROR IN WORKER MAIN:", error);
        throw error;
    }
}

main().catch((err) => {
    jobLogger.error("Error during worker startup:", err);
    process.exit(1);
});
