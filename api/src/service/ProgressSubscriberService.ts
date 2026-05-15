import { Server } from 'socket.io';
import { IEventBus } from '@statvision/common';
import logger from '../config/logger';

const JOB_PROGRESS_SUBSCRIPTION_NAME = process.env.JOB_PROGRESS_SUBSCRIPTION_NAME || 'job-progress-sub';

export interface ProgressUpdate {
    jobId: string;
    gameId: string;
    progress: number;
    currentPhase: string;
    details: string;
}

export class ProgressSubscriberService {
    constructor(
        private eventBus: IEventBus,
        private io: Server
    ) {}

    public async startSubscribing(): Promise<void> {
        logger.info(`[ProgressSubscriberService] Starting to subscribe to ${JOB_PROGRESS_SUBSCRIPTION_NAME}`);

        try {
            await this.eventBus.subscribe(JOB_PROGRESS_SUBSCRIPTION_NAME, async (update: ProgressUpdate, message: any) => {
                const { jobId, gameId } = update;
                logger.debug(`[ProgressSubscriberService] Received progress update for job ${jobId} (Game: ${gameId}): ${update.progress}%`);

                // Emit to the specific job room and game room
                this.io.to(`job:${jobId}`).emit('progress_update', update);
                this.io.to(`game:${gameId}`).emit('progress_update', update);

                if (message.ack) message.ack();
            });
        } catch (error) {
            logger.error(`[ProgressSubscriberService] Error subscribing to progress topic:`, error);
        }
    }
}
