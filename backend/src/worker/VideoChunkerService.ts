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
            const tempOutputFileName = `temp-chunk-${sequence}-${path.basename(filePath, path.extname(filePath))}-${currentStartTime.toFixed(0)}.mp4`;
            const tempChunkPath = path.join(tempDir, tempOutputFileName);

            const enhancedOutputFileName = `enhanced-chunk-${sequence}-${path.basename(filePath, path.extname(filePath))}-${currentStartTime.toFixed(0)}.mp4`;
            const enhancedChunkPath = path.join(tempDir, enhancedOutputFileName);

            const chunkCommand = `ffmpeg -i "${filePath}" -ss ${currentStartTime} -t ${chunkDuration} -c copy "${tempChunkPath}"`;

            logger.debug(`[VideoChunkerService] Executing ffmpeg chunking command for sequence ${sequence}: ${chunkCommand}`);
            await new Promise<void>((resolve, reject) => {
                exec(chunkCommand, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`[VideoChunkerService] FFmpeg chunking error for sequence ${sequence}: ${stderr}`);
                        return reject(error);
                    }
                    logger.debug(`[VideoChunkerService] FFmpeg chunking successful for sequence ${sequence}`);
                    resolve();
                });
            });

            const enhanceCommand = `ffmpeg -i "${tempChunkPath}" -vf "eq=contrast=1.3:gamma=1.1, unsharp=5:5:1.0:5:5:0.0" -c:a copy "${enhancedChunkPath}"`;
            logger.debug(`[VideoChunkerService] Executing ffmpeg enhancement command for sequence ${sequence}: ${enhanceCommand}`);
            await new Promise<void>((resolve, reject) => {
                exec(enhanceCommand, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`[VideoChunkerService] FFmpeg enhancement error for sequence ${sequence}: ${stderr}`);
                        return reject(error);
                    }
                    logger.debug(`[VideoChunkerService] FFmpeg enhancement successful for sequence ${sequence}`);
                    resolve();
                });
            });

            // Clean up the temporary, non-enhanced chunk
            try {
                await fs.promises.unlink(tempChunkPath);
                logger.debug(`Cleaned up temp chunk: ${tempChunkPath}`);
            } catch (error) {
                logger.warn(`Failed to clean up temp chunk ${tempChunkPath}:`, error);
            }

            chunks.push({ chunkPath: enhancedChunkPath, startTime: currentStartTime, sequence });
            progressBar?.increment({ task: `Chunking and enhancing video: ${enhancedOutputFileName}` });

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
