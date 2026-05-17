import * as cliProgress from 'cli-progress';
import { IEventBus } from '@statvision/common';
import { VideoAnalysisJobRepository } from './VideoAnalysisJobRepository';
import { jobLogger as logger } from '../config/loggers';

export interface ProgressUpdate {
    jobId: string;
    gameId: string;
    progress: number;
    currentPhase: string;
    details: string;
}

export class ProgressManager {
    private multiBar: cliProgress.MultiBar;
    private jobBars: Map<string, cliProgress.SingleBar> = new Map();
    private subTaskBars: Map<string, cliProgress.SingleBar> = new Map();
    private jobTotalChunks: Map<string, number> = new Map();
    private jobCompletedChunks: Map<string, number> = new Map();
    private jobGameIds: Map<string, string> = new Map();

    constructor(
        private eventBus: IEventBus,
        private jobRepository: VideoAnalysisJobRepository
    ) {
        this.multiBar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: ' {bar} | {percentage}% | {phase} | {details}',
        }, cliProgress.Presets.shades_classic);
    }

    public async addJob(jobId: string, totalChunks: number, gameId: string) {
        if (this.jobBars.has(jobId)) return;
        
        this.jobTotalChunks.set(jobId, totalChunks);
        this.jobCompletedChunks.set(jobId, 0);
        this.jobGameIds.set(jobId, gameId);

        const bar = this.multiBar.create(totalChunks, 0, {
            phase: `Job ${jobId.substring(0,5)}`,
            details: 'Waiting...'
        });
        this.jobBars.set(jobId, bar);

        // Update DB
        try {
            await this.jobRepository.update(jobId, {
                totalChunks,
                progress: 0,
                currentPhase: 'INITIALIZING'
            });
            await this.publishProgress(jobId, gameId, 0, 'INITIALIZING', 'Job initialized');
        } catch (error) {
            logger.error(`[ProgressManager] Error initializing job ${jobId} in DB:`, error);
        }
    }

    public async setTotalChunks(jobId: string, totalChunks: number) {
        this.jobTotalChunks.set(jobId, totalChunks);
        const bar = this.jobBars.get(jobId);
        if (bar) {
            bar.setTotal(totalChunks);
        }
        await this.jobRepository.update(jobId, { totalChunks });
    }

    public async updateJob(jobId: string, increment: number, details: string, phase?: string) {
        const bar = this.jobBars.get(jobId);
        const total = this.jobTotalChunks.get(jobId) || 1;
        const completed = (this.jobCompletedChunks.get(jobId) || 0) + increment;
        const gameId = this.jobGameIds.get(jobId) || 'unknown';
        
        this.jobCompletedChunks.set(jobId, completed);

        if (bar) {
            const payload: any = { details };
            if (phase) payload.phase = phase;
            bar.increment(increment, payload);
        }

        const progressPercent = Math.min(Math.round((completed / total) * 100), 100);
        const currentPhase = phase || 'PROCESSING';

        // Update DB and Publish
        try {
            await this.jobRepository.update(jobId, {
                progress: progressPercent,
                currentPhase: currentPhase
            });
            await this.publishProgress(jobId, gameId, progressPercent, currentPhase, details);
        } catch (error) {
            logger.error(`[ProgressManager] Error updating job ${jobId} progress:`, error);
        }
    }

    public async updateDetails(jobId: string, details: string, phase?: string) {
        const bar = this.jobBars.get(jobId);
        const total = this.jobTotalChunks.get(jobId) || 100;
        const completed = this.jobCompletedChunks.get(jobId) || 0;
        const gameId = this.jobGameIds.get(jobId) || 'unknown';

        if (bar) {
            const payload: any = { details };
            if (phase) payload.phase = phase;
            bar.update(completed, payload);
        }

        const progressPercent = Math.min(Math.round((completed / total) * 100), 100);
        const currentPhase = phase || 'PROCESSING';

        await this.publishProgress(jobId, gameId, progressPercent, currentPhase, details);
    }

    private async publishProgress(jobId: string, gameId: string, progress: number, currentPhase: string, details: string) {
        const topicName = process.env.JOB_PROGRESS_TOPIC_NAME || 'job-progress';
        const update: ProgressUpdate = {
            jobId,
            gameId,
            progress,
            currentPhase,
            details
        };
        try {
            await this.eventBus.publish(topicName, update);
        } catch (error) {
            logger.error(`[ProgressManager] Error publishing progress for job ${jobId}:`, error);
        }
    }

    public removeJob(jobId: string) {
        const bar = this.jobBars.get(jobId);
        if (bar) {
            bar.stop();
            this.multiBar.remove(bar);
            this.jobBars.delete(jobId);
            this.jobTotalChunks.delete(jobId);
            this.jobCompletedChunks.delete(jobId);
            this.jobGameIds.delete(jobId);
        }
    }

    public startChunkBar(id: string, total: number, phase: string, details: string) {
        if (this.subTaskBars.has(id)) {
            this.stopChunkBar(id);
        }
        const bar = this.multiBar.create(total, 0, { phase, details });
        this.subTaskBars.set(id, bar);
    }

    public updateChunkBar(options: { id?: string; value: number; details?: string; }) {
        const { id, value, details } = options;
        if (!id) return;
        const bar = this.subTaskBars.get(id);
        if (bar) {
            const payload = details ? { details } : {};
            bar.update(value, payload);
        }
    }
    
    public startIndeterminateBar(id: string, phase: string, details: string) {
        if (this.subTaskBars.has(id)) {
            this.stopChunkBar(id);
        }
        const bar = this.multiBar.create(100, 0, { phase, details });
        this.subTaskBars.set(id, bar);
        bar.start(100, 0);
    }

    public stopChunkBar(id?: string) {
        if (!id) return;
        const bar = this.subTaskBars.get(id);
        if (bar) {
            bar.stop();
            this.multiBar.remove(bar);
            this.subTaskBars.delete(id);
        }
    }

    public stopAll() {
        this.multiBar.stop();
    }
}
