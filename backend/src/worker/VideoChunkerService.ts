import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { workerConfig } from '../config/workerConfig';
import { ProgressManager } from './ProgressManager';
import { chunkLogger } from '../config/loggers';

export interface VideoChunk {
    chunkPath: string;
    startTime: number;
    sequence: number;
}

export interface VideoMetadata {
    duration: number;
    frameRate: number;
}

export class VideoChunkerService {

    public async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
        chunkLogger.debug(`[VideoChunkerService] Getting metadata for: ${filePath}`, { phase: 'chunking' });
        return new Promise((resolve, reject) => {
            const command = 'ffprobe';
            const args = [
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=r_frame_rate',
                '-of', 'default=noprint_wrappers=1',
                filePath
            ];
            
            const ffprobeProcess = spawn(command, args);
            let stdout = '';
            let stderr = '';

            ffprobeProcess.stdout.on('data', (data) => { stdout += data.toString(); });
            ffprobeProcess.stderr.on('data', (data) => { stderr += data.toString(); });

            ffprobeProcess.on('close', (code) => {
                if (code !== 0) {
                    const errorMessage = stderr || `ffprobe exited with code ${code}`;
                    chunkLogger.error(`[VideoChunkerService] ffprobe process failed for ${filePath}.`, {
                        error: {
                            message: errorMessage,
                            exitCode: code,
                            filePath: filePath,
                        },
                        phase: 'chunking'
                    });
                    return reject(new Error(errorMessage));
                }

                const durationMatch = stdout.match(/duration=([0-9\.]+)/);
                const frameRateMatch = stdout.match(/r_frame_rate=([0-9]+\/[0-9]+)/);

                if (!durationMatch || !frameRateMatch) {
                    chunkLogger.error(`[VideoChunkerService] Failed to parse ffprobe metadata output: ${stdout}`, { phase: 'chunking' });
                    return reject(new Error('Failed to parse ffprobe metadata output.'));
                }

                const duration = parseFloat(durationMatch[1]);
                const frameRateParts = frameRateMatch[1].split('/');
                const frameRate = parseInt(frameRateParts[0], 10) / parseInt(frameRateParts[1], 10);
                
                if (isNaN(duration) || isNaN(frameRate) || frameRate === 0) {
                    chunkLogger.error(`[VideoChunkerService] Invalid metadata parsed. Duration: ${duration}, FrameRate: ${frameRate}`, { phase: 'chunking' });
                    return reject(new Error('Invalid metadata parsed from video file.'));
                }

                chunkLogger.debug(`[VideoChunkerService] ffprobe success. Duration: ${duration}, FrameRate: ${frameRate}`, { phase: 'chunking' });
                resolve({ duration, frameRate });
            });

            ffprobeProcess.on('error', (err) => {
                chunkLogger.error(`[VideoChunkerService] Failed to start ffprobe process for ${filePath}.`, {
                    error: {
                        message: err.message,
                        stack: err.stack,
                        filePath: filePath,
                    },
                    phase: 'chunking'
                });
                reject(err);
            });
        });
    }

    public async chunkVideo(
        filePath: string,
        tempDir: string,
        chunkDuration: number,
        overlap: number,
        jobId: string
    ): Promise<VideoChunk[]> {
        chunkLogger.info(`[VideoChunkerService] Starting to chunk video: ${filePath}`, { phase: 'chunking' });
        const metadata = await this.getVideoMetadata(filePath);
        const totalDuration = metadata.duration;
        const frameRate = metadata.frameRate;

        const chunks: VideoChunk[] = [];
        let startTime = 0;
        let sequence = 0;

        const step = chunkDuration - overlap;
        const totalChunks = Math.ceil((totalDuration > overlap ? totalDuration - overlap : totalDuration) / step);
        chunkLogger.info(`[VideoChunkerService] Total chunks to generate: ${totalChunks} from a duration of ${totalDuration}s`, { phase: 'chunking' });


        while (startTime < totalDuration) {
            // Determine the duration for the current chunk
            const currentChunkDuration = Math.min(chunkDuration, totalDuration - startTime);

            // If the last chunk is very small (e.g., just overlap), skip it.
            if (currentChunkDuration < overlap && sequence > 0) {
                 chunkLogger.info(`[VideoChunkerService] Skipping final chunk of ${currentChunkDuration.toFixed(2)}s as it is smaller than overlap ${overlap}s.`, { phase: 'chunking' });
                 break;
            }
            
            chunkLogger.info(`[VideoChunkerService] Creating chunk ${sequence + 1} of approx ${totalChunks}`, { phase: 'chunking' });

            const chunkPath = await this.createSingleChunk(
                filePath,
                tempDir,
                startTime,
                currentChunkDuration,
                sequence,
                totalChunks,
                frameRate,
                jobId
            );

            chunks.push({
                chunkPath,
                startTime,
                sequence,
            });

            startTime += step;
            sequence++;
        }

        chunkLogger.info(`[VideoChunkerService] Finished chunking video. Created ${chunks.length} chunks.`, { phase: 'chunking' });
        return chunks;
    }

    public async createSingleChunk(
        filePath: string,
        tempDir: string,
        startTime: number,
        chunkDuration: number,
        sequence: number,
        totalChunks: number,
        frameRate: number,
        jobId: string
    ): Promise<string> {
        const outputFileName = `enhanced-chunk-${sequence}-${path.basename(filePath, path.extname(filePath))}-${startTime.toFixed(0)}.mp4`;
        const chunkPath = path.join(tempDir, outputFileName);
        
        const command = 'ffmpeg';
        const args = [
            '-y', '-stats',
            '-ss', String(startTime), '-i', filePath, '-t', String(chunkDuration),
            '-vf', workerConfig.ffmpegVideoFilter,
            '-c:v', 'libx264', '-preset', workerConfig.ffmpegPreset, '-crf', workerConfig.ffmpegCrf, '-c:a', 'aac',
            chunkPath
        ];

        chunkLogger.info(`[VideoChunkerService] Executing ffmpeg for sequence ${sequence + 1}/${totalChunks}`, { phase: 'chunking' });
        chunkLogger.debug(`[VideoChunkerService] FFmpeg command: ${command} ${args.join(' ')}`, { phase: 'chunking' });
        
        const progressManager = ProgressManager.getInstance();
        const totalFramesInChunk = Math.floor(chunkDuration * frameRate);
        const barId = `chunking-${jobId}-${sequence}`; // Unique ID for the bar
        progressManager.startChunkBar(barId, totalFramesInChunk, 'Chunking', `Chunk ${sequence + 1}/${totalChunks}`); // MODIFIED LINE

        return new Promise<string>((resolve, reject) => {
            const ffmpegProcess = spawn(command, args);
            let stderrBuffer = '';

            ffmpegProcess.stderr.on('data', (data) => {
                stderrBuffer += data.toString();
                let lineEnd;
                while ((lineEnd = stderrBuffer.indexOf('\r')) !== -1) {
                    const line = stderrBuffer.substring(0, lineEnd);
                    stderrBuffer = stderrBuffer.substring(lineEnd + 1);
                    
                    const frameMatch = line.match(/frame=\s*(\d+)/);
                    const fpsMatch = line.match(/fps=\s*([\d\.]+)/);

                    if (frameMatch && fpsMatch) {
                        const currentFrame = parseInt(frameMatch[1], 10);
                        const currentFps = parseFloat(fpsMatch[1]);
                        
                        const bitrateMatch = line.match(/bitrate=\s*([\d\.]+[a-zA-Z\/s]+)/);
                        const speedMatch = line.match(/speed=\s*([\d\.]+)x/);

                        const bitrate = bitrateMatch ? bitrateMatch[1] : '...';
                        const speed = speedMatch ? speedMatch[1] + 'x' : '...';

                        let details = `Chunk ${sequence + 1}/${totalChunks} | Pace: ${currentFps.toFixed(1)} fps | Speed: ${speed} | Bitrate: ${bitrate}`;
                        
                        if (currentFps > 0) {
                            const framesRemaining = totalFramesInChunk - currentFrame;
                            const etaSeconds = Math.round(framesRemaining / currentFps);
                            details += ` | ETA: ${etaSeconds}s`;
                        }

                        progressManager.updateChunkBar({ id: barId, value: currentFrame, details });
                    }
                }
            });

            ffmpegProcess.on('close', (code) => {
                progressManager.stopChunkBar(barId); // MODIFIED LINE
                if (code === 0) {
                    if (fs.existsSync(chunkPath)) {
                        chunkLogger.info(`[VideoChunkerService] FFmpeg successful for sequence ${sequence}, file created at ${chunkPath}.`, { phase: 'chunking' });
                        resolve(chunkPath);
                    } else {
                        const errorMessage = `FFmpeg exited with code 0 but the output file was not found at ${chunkPath}.`;
                        chunkLogger.error(`[VideoChunkerService] FFmpeg process had a silent failure for job ${jobId}, sequence ${sequence}.`, {
                            error: {
                                message: errorMessage,
                                exitCode: code,
                                jobId: jobId,
                                sequence: sequence,
                                filePath: filePath,
                                chunkPath: chunkPath,
                            },
                            phase: 'chunking'
                        });
                        reject(new Error(errorMessage));
                    }
                } else {
                    const errorMessage = `FFmpeg exited with code ${code}.\nStderr: ${stderrBuffer}`;
                    chunkLogger.error(`[VideoChunkerService] FFmpeg process failed for job ${jobId}, sequence ${sequence}.`, {
                        error: {
                            message: errorMessage,
                            exitCode: code,
                            jobId: jobId,
                            sequence: sequence,
                            filePath: filePath,
                            chunkPath: chunkPath,
                        },
                        phase: 'chunking'
                    });
                    reject(new Error(errorMessage));
                }
            });

            ffmpegProcess.on('error', (err) => {
                progressManager.stopChunkBar(barId); // MODIFIED LINE
                chunkLogger.error(`[VideoChunkerService] Failed to start ffmpeg process for job ${jobId}, sequence ${sequence}.`, {
                    error: {
                        message: err.message,
                        stack: err.stack,
                        jobId: jobId,
                        sequence: sequence,
                        filePath: filePath,
                    },
                    phase: 'chunking'
                });
                reject(err);
            });
        });
    }

    public async cleanupChunks(chunkPaths: string[]): Promise<void> {
        chunkLogger.info(`[VideoChunkerService] Cleaning up ${chunkPaths.length} temporary video chunks...`, { phase: 'chunking' });
        for (const chunkPath of chunkPaths) {
            try {
                await fs.promises.unlink(chunkPath);
                chunkLogger.debug(`Cleaned up chunk: ${chunkPath}`, { phase: 'chunking' });
            } catch (error: any) {
                chunkLogger.warn(`Failed to clean up chunk ${chunkPath}.`, {
                    error: {
                        message: error.message,
                        stack: error.stack,
                        chunkPath: chunkPath,
                    },
                    phase: 'chunking'
                });
            }
        }
    }
}
