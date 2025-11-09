import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as cliProgress from 'cli-progress';
import logger from '../config/logger';

export interface VideoChunk {
    chunkPath: string;
    startTime: number;
    sequence: number;
}

export class VideoChunkerService {

    private async getVideoDuration(filePath: string): Promise<number> {
        logger.debug(`[VideoChunkerService] Getting duration for: ${filePath}`);
        return new Promise((resolve, reject) => {
            const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`[VideoChunkerService] ffprobe error: ${stderr}`);
                    return reject(new Error(stderr));
                }
                const duration = parseFloat(stdout);
                logger.debug(`[VideoChunkerService] ffprobe success. Duration: ${duration}`);
                resolve(duration);
            });
        });
    }

    public async chunkVideo(filePath: string, tempDir: string, chunkDuration: number, overlapDuration: number, progressBar?: cliProgress.SingleBar): Promise<VideoChunk[]> {
        logger.info(`[VideoChunkerService] Starting chunking and enhancement for ${filePath}`);
        const chunks: VideoChunk[] = [];
        const videoDuration = await this.getVideoDuration(filePath);
        logger.debug(`[VideoChunkerService] Total video duration is ${videoDuration} seconds.`);
        
        let currentStartTime = 0;
        let sequence = 0;

        const stepDuration = chunkDuration - overlapDuration;
        const totalChunksExpected = videoDuration > 0 ? Math.ceil(videoDuration / stepDuration) : 0;
        progressBar?.setTotal(totalChunksExpected);
        progressBar?.update(0, { task: 'Chunking & Enhancing', unit: 'chunks' });

        while (currentStartTime < videoDuration) {
            const outputFileName = `enhanced-chunk-${sequence}-${path.basename(filePath, path.extname(filePath))}-${currentStartTime.toFixed(0)}.mp4`;
            const chunkPath = path.join(tempDir, outputFileName);

            // REASON FOR CHANGE:
            // Combined chunking and enhancement into a single ffmpeg command.
            // 1. `-ss ${currentStartTime}`: Seeks to the start time. Placed before -i for faster seeking on keyframes.
            // 2. `-t ${chunkDuration}`: Specifies the duration of the clip to extract.
            // 3. `-vf "..."`: Applies video filters. This requires re-encoding.
            // 4. `-c:v libx264 -preset veryfast -crf 23`: Re-encodes the video with a balance of speed and quality.
            // 5. `-c:a aac`: Re-encodes the audio to a standard format. `-c copy` is removed as it's incompatible with filtering.
            const command = `ffmpeg -ss ${currentStartTime} -i "${filePath}" -t ${chunkDuration} -vf "eq=contrast=1.2:gamma=1.1, unsharp=3:3:0.5:3:3:0.0" -c:v libx264 -preset veryfast -crf 23 -c:a aac "${chunkPath}"`;

            logger.debug(`[VideoChunkerService] Executing ffmpeg command for sequence ${sequence}: ${command}`);
            await new Promise<void>((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`[VideoChunkerService] FFmpeg error for sequence ${sequence}: ${stderr}`);
                        return reject(new Error(stderr));
                    }
                    logger.debug(`[VideoChunkerService] FFmpeg successful for sequence ${sequence}`);
                    resolve();
                });
            });

            chunks.push({ chunkPath, startTime: currentStartTime, sequence });
            progressBar?.increment({ task: `Processed chunk: ${outputFileName}` });

            currentStartTime += stepDuration;
            sequence++;
        }
        return chunks;
    }

    public async cleanupChunks(chunkPaths: string[]): Promise<void> {
        logger.info("[VideoChunkerService] Cleaning up temporary video chunks...");
        for (const chunkPath of chunkPaths) {
            try {
                await fs.promises.unlink(chunkPath);
                logger.debug(`Cleaned up chunk: ${chunkPath}`);
            } catch (error) {
                logger.warn(`Failed to clean up chunk ${chunkPath}:`, error);
            }
        }
    }
}
