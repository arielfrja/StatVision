import { ProgressManager } from './ProgressManager';
import { DataSource } from "typeorm";
import { 
    VideoAnalysisJob, VideoAnalysisJobStatus, 
    IStorageProvider, IVideoIntelligenceProvider,
    Game, GameStatus 
} from "@statvision/common";
import { VideoAnalysisJobRepository } from "./VideoAnalysisJobRepository";
import { ChunkRepository } from "./ChunkRepository";
import { ChunkStatus } from "@statvision/common";
import { jobLogger } from '../config/loggers';
import { VideoChunkerService } from "./VideoChunkerService";
import { GameEvent, GameEventStatus, IEventBus } from '@statvision/common';
import { VideoAnalysisResultService } from '../service/VideoAnalysisResultService';
import * as fs from 'fs';
import * as path from 'path';

const VIDEO_ANALYSIS_RESULTS_TOPIC_NAME = process.env.VIDEO_ANALYSIS_RESULTS_TOPIC_NAME || 'video-analysis-results';

export class JobFinalizerService {
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private videoChunkerService: VideoChunkerService;
    private logger = jobLogger;

    constructor(
        private dataSource: DataSource, 
        private eventBus: IEventBus,
        private progressManager: ProgressManager,
        private storageProvider?: IStorageProvider,
        private videoAnalysisResultService?: VideoAnalysisResultService,
        private analysisProvider?: IVideoIntelligenceProvider
    ) {
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.videoChunkerService = new VideoChunkerService();
    }

    public async finalizeJob(jobId: string): Promise<void> {
        this.logger.info(`[JobFinalizerService] Checking final status for job ${jobId}`, { phase: 'finalizing' });

        const job = await this.jobRepository.findOneById(jobId);
        if (!job) {
            this.logger.error(`[JobFinalizerService] Job ${jobId} not found.`, { phase: 'finalizing' });
            return;
        }

        if (job.status === VideoAnalysisJobStatus.COMPLETED || job.status === VideoAnalysisJobStatus.FAILED) {
            this.logger.info(`[JobFinalizerService] Job ${jobId} is already in a terminal state: ${job.status}. No action needed.`, { phase: 'finalizing' });
            return;
        }

        const chunks = await this.chunkRepository.findByJobId(jobId);
        if (chunks.length === 0) {
            this.logger.warn(`[JobFinalizerService] No chunks found for job ${jobId}. Cannot determine final status yet.`, { phase: 'finalizing' });
            return;
        }

        const totalChunks = chunks.length;
        const completedChunks = chunks.filter(c => c.status === ChunkStatus.COMPLETED).length;
        const failedChunks = chunks.filter(c => c.status === ChunkStatus.FAILED);

        this.logger.debug(`[JobFinalizerService] Job ${jobId} chunk status: ${completedChunks}/${totalChunks} completed, ${failedChunks.length}/${totalChunks} failed.`, { phase: 'finalizing' });

        let finalStatus: VideoAnalysisJobStatus | null = null;
        let failureReason: string | null = null;

        // Rule 1: If any chunk has failed, the entire job is marked as FAILED.
        if (failedChunks.length > 0) {
            finalStatus = VideoAnalysisJobStatus.FAILED;
            const failedChunkReasons = failedChunks.map(c => `Chunk ${c.sequence}: ${c.failureReason || 'Unknown reason'}`).join('\n');
            failureReason = `Job failed because ${failedChunks.length} out of ${totalChunks} chunk(s) failed processing.\nDetails:\n${failedChunkReasons}`;
            this.logger.warn(`[JobFinalizerService] Marking job ${jobId} as FAILED due to failed chunks. Details: ${failureReason}`, { phase: 'finalizing' });
        }
        // Rule 2: If all chunks are completed, the job is COMPLETED.
        else if (completedChunks === totalChunks) {
            finalStatus = VideoAnalysisJobStatus.COMPLETED;
            this.logger.info(`[JobFinalizerService] Marking job ${jobId} as COMPLETED.`, { phase: 'finalizing' });
        }

        if (finalStatus) {
            await this.dataSource.transaction(async (transactionalEntityManager) => {
                const currentStatus = finalStatus!;
                const allEvents: any[] = [];
                let allPlayers: any[] = [];
                let allTeams: any[] = [];

                if (currentStatus === VideoAnalysisJobStatus.COMPLETED) {
                    // Merge data from all chunks
                    const playerMap = new Map<string, any>();
                    const teamMap = new Map<string, any>();

                    // Sort chunks by sequence to ensure consistent merging
                    const sortedChunks = chunks.sort((a, b) => a.sequence - b.sequence);

                    for (const chunk of sortedChunks) {
                        // Merge Players
                        if (chunk.identifiedPlayers) {
                            for (const p of chunk.identifiedPlayers) {
                                playerMap.set(p.id, p);
                            }
                        }
                        // Merge Teams
                        if (chunk.identifiedTeams) {
                            for (const t of chunk.identifiedTeams) {
                                teamMap.set(t.id, t);
                            }
                        }
                        // Aggregate events from all chunks (Authoritative Window ensures no duplicates)
                        if (chunk.processedEvents) {
                            // Map processed events to include the chunkId for the database
                            const chunkEvents = chunk.processedEvents.map(e => ({
                                ...e,
                                chunkId: chunk.id
                            }));
                            allEvents.push(...chunkEvents);
                        }
                    }
                    allPlayers = Array.from(playerMap.values());
                    allTeams = Array.from(teamMap.values());

                    // --- NEW: Persist to GameEvent table ---
                    if (allEvents.length > 0) {
                        this.logger.info(`[JobFinalizerService] Persisting \${allEvents.length} events to GameEvent table for game \${job.gameId}`, { phase: 'finalizing' });
                        
                        // Resolve Player IDs (Discovery) for all events before final save
                        let finalizedEvents = allEvents;
                        if (this.videoAnalysisResultService) {
                            finalizedEvents = await this.videoAnalysisResultService.resolvePlayerIds(job.gameId, allEvents, job.userId);
                        }

                        // Clear any existing DRAFT events for this game to avoid duplicates on re-runs
                        await transactionalEntityManager.delete(GameEvent, { 
                            gameId: job.gameId,
                            status: GameEventStatus.DRAFT 
                        });

                        const gameEvents = finalizedEvents.map(eventData => {
                            const event = new GameEvent();
                            
                            // Explicit Mapping
                            event.id = eventData.id;
                            event.gameId = job.gameId;
                            
                            // Validate and sanitize UUIDs
                            event.chunkId = this.isUuid(eventData.chunkId) ? eventData.chunkId : null;
                            event.assignedTeamId = this.isUuid(eventData.assignedTeamId) ? eventData.assignedTeamId : null;
                            event.assignedPlayerId = this.isUuid(eventData.assignedPlayerId) ? eventData.assignedPlayerId : null;
                            
                            event.status = GameEventStatus.DRAFT;
                            event.eventType = eventData.eventType;
                            event.eventSubType = eventData.eventSubType;
                            event.isSuccessful = !!eventData.isSuccessful;
                            
                            // Sanitized Numeric Fields
                            event.period = typeof eventData.period === 'number' ? eventData.period : 1;
                            event.timeRemaining = this.parseTime(eventData.timeRemaining || eventData.timestamp);
                            event.absoluteTimestamp = this.parseTime(eventData.absoluteTimestamp || eventData.timestamp);
                            event.videoClipStartTime = this.parseTime(eventData.videoClipStartTime);
                            event.videoClipEndTime = this.parseTime(eventData.videoClipEndTime);
                            
                            event.xCoord = typeof eventData.xCoord === 'number' ? eventData.xCoord : 0;
                            event.yCoord = typeof eventData.yCoord === 'number' ? eventData.yCoord : 0;

                            event.identifiedTeamColor = eventData.identifiedTeamColor;
                            event.identifiedJerseyNumber = typeof eventData.identifiedJerseyNumber === 'number' ? eventData.identifiedJerseyNumber : null;
                            event.onCourtPlayerIds = eventData.onCourtPlayerIds;
                            
                            return event;
                        });

                        // Bulk insert for efficiency
                        await transactionalEntityManager.save(GameEvent, gameEvents, { chunk: 100 });
                    }
                }

                // Update the job with aggregated results (keep JSON as backup/legacy support for now)
                await transactionalEntityManager.update(VideoAnalysisJob, jobId, {
                    status: currentStatus,
                    failureReason,
                    processedEvents: allEvents.length > 0 ? allEvents : null,
                    identifiedPlayers: allPlayers.length > 0 ? allPlayers : null,
                    identifiedTeams: allTeams.length > 0 ? allTeams : null,
                });
            });

            this.progressManager.removeJob(jobId);

            // Fetch the updated job for Pub/Sub (after transaction)
            const updatedJob = await this.jobRepository.findOneById(jobId);

            // Publish the final result to the results topic
            try {
                const message = {
                    jobId: updatedJob?.id,
                    gameId: updatedJob?.gameId,
                    userId: updatedJob?.userId,
                    status: finalStatus,
                    failureReason: failureReason,
                    processedEvents: updatedJob?.processedEvents,
                    identifiedPlayers: updatedJob?.identifiedPlayers,
                    identifiedTeams: updatedJob?.identifiedTeams,
                } as any;

                // --- NEW: Direct call to ResultService for internal DB updates (since Pull is disabled) ---
                if (this.videoAnalysisResultService) {
                    await this.videoAnalysisResultService.handleFinalResult(message);
                }

                await this.eventBus.publish(VIDEO_ANALYSIS_RESULTS_TOPIC_NAME, message);
                this.logger.info(`[JobFinalizerService] Published final status '${finalStatus}' for job ${jobId} to topic ${VIDEO_ANALYSIS_RESULTS_TOPIC_NAME}.`, { phase: 'finalizing' });
            } catch (error: any) {
                this.logger.error(`[JobFinalizerService] Failed to publish final status for job ${jobId} to topic ${VIDEO_ANALYSIS_RESULTS_TOPIC_NAME}.`, {
                    error: {
                        message: error.message,
                        stack: error.stack,
                        jobId: jobId,
                    },
                    phase: 'finalizing'
                });
            }

            // --- EXECUTE FINAL LIFECYCLE EVENT ---
            await this.onJobFinal(jobId, finalStatus);

        } else {
            this.logger.info(`[JobFinalizerService] Job ${jobId} is not yet in a terminal state. Waiting for more chunks to complete.`, { phase: 'finalizing' });
        }
    }

    /**
     * The absolute final step of the job lifecycle.
     * Called only once when all chunks are verified as terminal.
     */
    private async onJobFinal(jobId: string, status: VideoAnalysisJobStatus): Promise<void> {
        this.logger.info(`[JOB_FINAL] 🏁 Starting total finalization for job ${jobId} with status ${status}`, { phase: 'finalizing' });

        try {
            const job = await this.jobRepository.findOneById(jobId);
            if (!job) return;

            // 1. Calculate Total AI Usage
            const usageRecords = await this.dataSource.query(
                `SELECT amount, created_at FROM ai_usage_records WHERE resource_id IN 
                (SELECT id::text FROM worker_video_analysis_chunks WHERE job_id = $1)
                AND type = 'TOKEN'`, 
                [jobId]
            );
            
            const totalTokens = usageRecords.reduce((sum: number, r: any) => sum + r.amount, 0);
            
            // Calculate rate (demo video is ~15 mins, but let's be precise if we have metadata)
            const metadata = await this.videoChunkerService.getVideoMetadata(job.filePath).catch(() => ({ duration: 900 }));
            const durationMins = metadata.duration / 60;
            const tokensPerMin = totalTokens / durationMins;

            this.logger.info(`[JOB_FINAL] 📊 AI USAGE SUMMARY for Job ${jobId}:`, {
                totalTokens,
                videoDuration: `${metadata.duration.toFixed(2)}s`,
                tokensPerMinute: tokensPerMin.toFixed(2),
                phase: 'finalizing'
            });

            // 2. Update Game Status
            const gameRepository = this.dataSource.getRepository(Game);
            await gameRepository.update(job.gameId, { 
                status: status === VideoAnalysisJobStatus.COMPLETED ? GameStatus.COMPLETED : GameStatus.FAILED 
            });

            // 3. Resource Cleanup (Sanitization Phase)
            this.logger.info(`[JOB_FINAL] Starting resource sanitization...`, { phase: 'finalizing' });

            // Cleanup Gemini File API session
            if (job.geminiFileName && this.analysisProvider) {
                this.logger.info(`[JOB_FINAL] Deleting Gemini File session: ${job.geminiFileName}`, { phase: 'finalizing' });
                await this.analysisProvider.deleteFile(job.geminiFileName).catch(err => 
                    this.logger.warn(`Failed to cleanup Gemini file session ${job.geminiFileName}`, { error: err })
                );
            }

            // Cleanup Cloud Storage (GCS) - Main Video (Final step, once everything is analyzed)
            if (this.storageProvider && job.filePath.startsWith('gs://')) {
                const uriParts = job.filePath.split('/');
                const remotePath = uriParts.slice(3).join('/');
                this.logger.info(`[JOB_FINAL] Deleting source video from GCS: ${remotePath}`, { phase: 'finalizing' });
                await this.storageProvider.deleteFile(remotePath).catch(err =>
                    this.logger.warn(`Failed to delete source video ${remotePath}`, { error: err })
                );
            }

            // Cleanup Local Worker Cache
            const tempBaseDir = process.env.WORKER_TEMP_DIR || '/tmp/statvision';
            const workerJobDir = path.join(tempBaseDir, jobId);
            if (fs.existsSync(workerJobDir)) {
                this.logger.info(`[JOB_FINAL] Purging local job cache directory: ${workerJobDir}`, { phase: 'finalizing' });
                fs.rmSync(workerJobDir, { recursive: true, force: true });
            }

            this.logger.info(`[JOB_FINAL] ✅ Finalization complete for job ${jobId}. User updated and resources purged.`, { phase: 'finalizing' });

        } catch (error: any) {
            this.logger.error(`[JOB_FINAL] ❌ Critical error during finalization: ${error.message}`, { error, phase: 'finalizing' });
        }
    }

    private parseTime(time: any): number {
        if (time === null || time === undefined) return 0;
        if (typeof time === 'number') return isNaN(time) ? 0 : time;
        
        if (typeof time === 'string') {
            const cleanTime = time.trim();
            if (cleanTime.includes(':')) {
                const parts = cleanTime.split(':').map(p => parseInt(p, 10));
                if (parts.some(isNaN)) return 0;

                if (parts.length === 2) {
                    return (parts[0] || 0) * 60 + (parts[1] || 0);
                } else if (parts.length === 3) {
                    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
                }
            }
            const parsed = parseFloat(cleanTime);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    private isUuid(id: string | null | undefined): boolean {
        if (!id) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof id === 'string' && (id.startsWith('chunk-') || id.startsWith('TEMP_'))) return false;
        return uuidRegex.test(id);
    }
}
