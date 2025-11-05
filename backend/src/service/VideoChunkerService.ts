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
            logger.debug(`[VideoChunkerService] Executing command: ${command}`);
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`[VideoChunkerService] ffprobe error: ${stderr}`);
                    return reject(error);
                }
                const duration = parseFloat(stdout);
                logger.debug(`[VideoChunkerService] ffprobe success. Duration: ${duration}`);
                resolve(duration);
            });
        });
    }

    public async chunkVideo(filePath: string, tempDir: string, chunkDuration: number, overlapDuration: number, progressBar?: cliProgress.SingleBar): Promise<VideoChunk[]> {
        logger.info(`[VideoChunkerService] Starting chunking for ${filePath}`);
        const chunks: VideoChunk[] = [];
        const videoDuration = await this.getVideoDuration(filePath);
        logger.debug(`[VideoChunkerService] Total video duration is ${videoDuration} seconds.`);
        let currentStartTime = 0;
        let sequence = 0;

        const totalChunksExpected = Math.ceil(videoDuration / (chunkDuration - overlapDuration));
        progressBar?.setTotal(totalChunksExpected);
        progressBar?.update(0, { task: 'Chunking video', unit: 'chunks' });

        while (currentStartTime < videoDuration) {
            const outputFileName = `chunk-${sequence}-${path.basename(filePath, path.extname(filePath))}-${currentStartTime.toFixed(0)}.mp4`;
            const chunkPath = path.join(tempDir, outputFileName);
            const command = `ffmpeg -i "${filePath}" -ss ${currentStartTime} -t ${chunkDuration} -c copy "${chunkPath}"`;

            logger.debug(`[VideoChunkerService] Executing ffmpeg command for sequence ${sequence}: ${command}`);
            await new Promise<void>((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`[VideoChunkerService] FFmpeg chunking error for sequence ${sequence}: ${stderr}`);
                        return reject(error);
                    }
                    logger.debug(`[VideoChunkerService] FFmpeg chunking successful for sequence ${sequence}`);
                    resolve();
                });
            });

            chunks.push({ chunkPath, startTime: currentStartTime, sequence });
            progressBar?.increment({ task: `Chunking video: ${outputFileName}` });

            currentStartTime += (chunkDuration - overlapDuration);
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
