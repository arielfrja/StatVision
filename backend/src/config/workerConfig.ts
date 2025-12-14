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
    processingMode: process.env.PROCESSING_MODE || 'PARALLEL',

    // Pub/Sub settings
    ackDeadlineSeconds: parseInt(process.env.ACK_DEADLINE_SECONDS || '60', 10),
    heartbeatIntervalSeconds: parseInt(process.env.HEARTBEAT_INTERVAL_SECONDS || '45', 10),
    
    // Orchestrator settings
    parallelJobLimit: parseInt(process.env.PARALLEL_JOB_LIMIT || '5', 10),
    
    // Chunker settings
    chunkDurationSeconds: parseInt(process.env.CHUNK_DURATION_SECONDS || '150', 10),
    chunkOverlapSeconds: parseInt(process.env.CHUNK_OVERLAP_SECONDS || '30', 10),

    // FFmpeg settings for chunk enhancement
    ffmpegVideoFilter: process.env.FFMPEG_VF || 'eq=contrast=1.2:gamma=1.1, unsharp=3:3:0.5:3:3:0.0',
    ffmpegPreset: process.env.FFMPEG_PRESET || 'veryfast',
    ffmpegCrf: process.env.FFMPEG_CRF || '23',

    // Gemini API settings
    geminiModelName: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash',
    geminiFilePollIntervalMs: parseInt(process.env.GEMINI_POLL_INTERVAL_MS || '5000', 10),
    geminiFilePollMaxRetries: parseInt(process.env.GEMINI_POLL_MAX_RETRIES || '48', 10),

    // Chunk Processor settings
    parallelStageLimit: parseInt(process.env.PARALLEL_STAGE_LIMIT || '3', 10),
};
