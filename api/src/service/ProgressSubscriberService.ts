import { IEventBus } from '@statvision/common';
import logger from '../config/logger';
import { NotificationService } from './NotificationService';

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
        private notificationService: NotificationService
    ) {}

    public async startSubscribing(): Promise<void> {
        logger.info(`[ProgressSubscriberService] Starting to subscribe to ${JOB_PROGRESS_SUBSCRIPTION_NAME}`);

        try {
            await this.eventBus.subscribe(JOB_PROGRESS_SUBSCRIPTION_NAME, async (update: ProgressUpdate, message: any) => {
                const { jobId, progress, currentPhase, details, gameId } = update;
                logger.debug(`[ProgressSubscriberService] Received progress update for job ${jobId}: ${progress}%`);

                // Synchronize progress to Firebase Realtime DB
                await this.notificationService.updateJobProgress(jobId, {
                    progress,
                    status: currentPhase,
                    details,
                    gameId
                });

                if (message.ack) message.ack();
            });
        } catch (error) {
            logger.error(`[ProgressSubscriberService] Error subscribing to progress topic:`, error);
        }
    }
}
