import dotenv from 'dotenv';
import path from 'path';

// This ensures that the worker-specific environment variables are loaded.
// It's safe to call this multiple times, as dotenv will not override existing process.env values.
dotenv.config({ path: path.resolve(__dirname, '../../.env.worker') });

/**
 * A centralized configuration object for the video processing worker.
 *
 * It provides sensible defaults for all settings and allows any setting to be
 * easily overridden using environment variables. This makes the worker flexible
 * and easy to manage without changing the code.
 */
export const workerConfig = {
    /** 
     * The processing mode for the worker.
     * SEQUENTIAL: Processes one job at a time, and chunks within that job are processed in strict order.
     * PARALLEL: Processes multiple jobs, with concurrency limits applied at each chunk sequence stage.
     */
    processingMode: process.env.PROCESSING_MODE || 'SEQUENTIAL',

    /**
     * Chunking Mode:
     * VIRTUAL (Recommended): Uses logical offsets (start/end) on a single video file. No FFmpeg slicing.
     * PHYSICAL: Slices the video into many small MP4 files using FFmpeg. High CPU usage.
     */
    chunkingMode: (process.env.CHUNKING_MODE || 'VIRTUAL').toUpperCase(),

    // Pub/Sub settings
    ackDeadlineSeconds: parseInt(process.env.ACK_DEADLINE_SECONDS || '60', 10),
    heartbeatIntervalSeconds: parseInt(process.env.HEARTBEAT_INTERVAL_SECONDS || '45', 10),
    chunkAnalysisResultsTopicName: process.env.CHUNK_ANALYSIS_RESULTS_TOPIC_NAME || 'chunk-analysis-results',
    
    // Orchestrator settings
    parallelJobLimit: parseInt(process.env.PARALLEL_JOB_LIMIT || '5', 10),
    
    // Chunker settings
    chunkDurationSeconds: parseInt(process.env.CHUNK_DURATION_SECONDS || '120', 10), // 2 minutes
    chunkOverlapSeconds: parseInt(process.env.CHUNK_OVERLAP_SECONDS || '10', 10), // 10s overlap for continuity

    // FFmpeg settings for chunk enhancement
    ffmpegVideoFilter: process.env.FFMPEG_VF || 'eq=contrast=1.2:gamma=1.1, unsharp=3:3:0.5:3:3:0.0',
    ffmpegPreset: process.env.FFMPEG_PRESET || 'veryfast',
    ffmpegCrf: process.env.FFMPEG_CRF || '23',

    // Gemini API settings
    geminiModelName: (() => {
        const name = process.env.GEMINI_MODEL_NAME;
        if (!name) {
            throw new Error('MISSING_CONFIG: GEMINI_MODEL_NAME environment variable is required.');
        }
        return name;
    })(),
    geminiFilePollIntervalMs: parseInt(process.env.GEMINI_POLL_INTERVAL_MS || '5000', 10),
    geminiFilePollMaxRetries: parseInt(process.env.GEMINI_POLL_MAX_RETRIES || '200', 10), 

    // Chunk Processor settings
    parallelStageLimit: parseInt(process.env.PARALLEL_STAGE_LIMIT || '3', 10),

    // Cloud Tasks settings
    cloudTasksProjectId: process.env.CLOUD_TASKS_PROJECT_ID || process.env.GCP_PROJECT_ID || 'statsvision-477017',
    cloudTasksLocation: process.env.CLOUD_TASKS_LOCATION || 'us-central1',
    cloudTasksQueueName: process.env.CLOUD_TASKS_QUEUE_NAME || 'analyze-queue',
    analyzerUrl: process.env.ANALYZER_URL || 'https://statvision-worker-test-chsbu3g4oa-uc.a.run.app/api/analyze-chunk',
};
