import { Router, Request, Response } from 'express';
import { chunkLogger as logger } from '../config/loggers';
import { DataSource } from 'typeorm';
import { PubSub } from '@google-cloud/pubsub';
import { ChunkRepository } from '../worker/ChunkRepository';
import { Chunk, ChunkStatus } from '../worker/Chunk';

import { VideoAnalysisJob } from '../worker/VideoAnalysisJob'; // Import VideoAnalysisJob entity

export const analysisRoutes = (dataSource: DataSource, pubSubClient: PubSub) => {
    const router = Router();
    const chunkRepository = new ChunkRepository(dataSource);
    logger.debug(`Entities registered with DataSource in analysisRoutes: ${dataSource.entityMetadatas.map(meta => meta.name).join(', ')}`);
    const CHUNK_ANALYSIS_TOPIC_NAME = process.env.CHUNK_ANALYSIS_TOPIC_NAME || 'chunk-analysis-topic';

    // Define API key authentication middleware
    const apiKeyAuthMiddleware = (req: Request, res: Response, next: Function) => {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ message: 'Unauthorized: X-API-Key header missing.' });
        }
        if (apiKey !== process.env.API_KEY) { // Use the generic API_KEY
            return res.status(403).json({ message: 'Forbidden: Invalid API Key.' });
        }
        next();
    };

    router.post('/reanalyze', apiKeyAuthMiddleware, async (req: Request, res: Response) => {
        const { jobId, chunkId } = req.body;

        if (!jobId && !chunkId) {
            return res.status(400).json({ message: 'Either jobId or chunkId is required.' });
        }

        logger.info(`Received re-analysis request: jobId=${jobId || 'N/A'}, chunkId=${chunkId || 'N/A'}`);

        try {
            let chunksToReanalyze: Chunk[] = [];

            if (chunkId) {
                const chunk = await chunkRepository.findOneById(chunkId);
                if (!chunk) {
                    return res.status(404).json({ message: `Chunk with ID ${chunkId} not found.` });
                }
                chunksToReanalyze.push(chunk);
            } else if (jobId) {
                const videoAnalysisJobEntityRepository = dataSource.getRepository(VideoAnalysisJob);
                const job = await videoAnalysisJobEntityRepository.findOne({ where: { id: jobId } });
                if (!job) {
                    return res.status(404).json({ message: `Job with ID ${jobId} not found.` });
                }
                chunksToReanalyze = await chunkRepository.findByJobId(jobId);
                if (chunksToReanalyze.length === 0) {
                    return res.status(404).json({ message: `No chunks found for job with ID ${jobId}.` });
                }
            }

            for (const chunk of chunksToReanalyze) {
                chunk.status = ChunkStatus.AWAITING_ANALYSIS;
                chunk.failureReason = null; // Clear any previous failure reason
                chunk.thoughtSignature = null; // Clear previous thought signature
                chunk.rawGeminiResponse = null; // Clear previous raw response

                await chunkRepository.update(chunk);

                // Publish message to Pub/Sub for re-analysis
                const messageId = await pubSubClient
                    .topic(CHUNK_ANALYSIS_TOPIC_NAME)
                    .publishMessage({ json: { jobId: chunk.jobId, chunkId: chunk.id } });

                logger.info(`Published re-analysis message for chunk ${chunk.id} (Job ${chunk.jobId}). Message ID: ${messageId}`);
            }

            res.status(202).json({
                message: `Re-analysis request received for ${chunksToReanalyze.length} chunk(s).`,
                chunksReanalyzed: chunksToReanalyze.map(c => c.id)
            });

        } catch (error: any) {
            logger.error(`Error during re-analysis request: ${error.message}`, { error: error.stack });
            res.status(500).json({ message: 'Internal server error during re-analysis.', error: error.message });
        }
    });

    return router;
};