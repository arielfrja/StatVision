import { PubSub } from '@google-cloud/pubsub';
import { DataSource } from 'typeorm';
import path from 'path';
import dotenv from 'dotenv';

// Entities
import { VideoAnalysisJob, Chunk, ChunkStatus, VideoAnalysisJobStatus } from '@statvision/common';

dotenv.config({ path: path.resolve(__dirname, './api/.env') });

async function resumeAnalysis() {
    const jobId = 'a6c07a5f-febb-4e70-82dd-42dabc5e981a';
    const failedChunkId = 'e1117436-a3e8-4d11-a024-c15e78c84248';

    console.log(`🚀 Resuming analysis for Job ${jobId}...`);

    // 1. Initialize Data Source to update statuses
    const dataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME || "statsvision",
        password: process.env.DB_PASSWORD || "statsvision_password",
        database: process.env.DB_DATABASE || "statsvision_db",
        entities: [VideoAnalysisJob, Chunk],
        synchronize: false,
    });

    await dataSource.initialize();

    try {
        // 2. Reset Statuses
        await dataSource.createQueryBuilder()
            .update(VideoAnalysisJob)
            .set({ status: VideoAnalysisJobStatus.PROCESSING, failureReason: null })
            .where("id = :id", { id: jobId })
            .execute();

        await dataSource.createQueryBuilder()
            .update(Chunk)
            .set({ status: ChunkStatus.PENDING, failureReason: null })
            .where("id = :id", { id: failedChunkId })
            .execute();

        console.log("✅ Database statuses reset.");

        // 3. Publish Pub/Sub Message
        const pubSubClient = new PubSub({ projectId: 'statvision-local' });
        const topicName = 'chunk-analysis';
        const message = { jobId, chunkId: failedChunkId };
        const dataBuffer = Buffer.from(JSON.stringify(message));

        const messageId = await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
        console.log(`✅ Message ${messageId} published to ${topicName}.`);

    } finally {
        await dataSource.destroy();
    }
}

resumeAnalysis().catch(console.error);
