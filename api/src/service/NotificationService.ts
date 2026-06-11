import { initializeApp, getApps } from 'firebase-admin/app';
import { applicationDefault } from 'firebase-admin/app';
import { getDatabase, Database, ServerValue } from 'firebase-admin/database';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import logger from '../config/logger';

export class NotificationService {
    private db: Database | null = null;
    private messaging: Messaging | null = null;

    constructor() {
        try {
            // Initialize Firebase Admin with default credentials (ADC)
            if (getApps().length === 0) {
                initializeApp({
                    credential: applicationDefault(),
                    databaseURL: process.env.FIREBASE_DATABASE_URL
                });
            }
            this.db = getDatabase();
            this.messaging = getMessaging();
            logger.info('[NotificationService] Firebase Admin initialized.');
        } catch (error) {
            logger.error('[NotificationService] Failed to initialize Firebase Admin:', error);
        }
    }

    /**
     * Updates the real-time progress and status of a job in Firebase Realtime Database.
     */
    public async updateJobProgress(jobId: string, update: {
        progress: number;
        status: string;
        details?: string;
        gameId?: string;
    }): Promise<void> {
        if (!this.db) return;

        try {
            const ref = this.db.ref(`jobs/${jobId}`);
            await ref.update({
                ...update,
                updatedAt: ServerValue.TIMESTAMP
            });
            logger.debug(`[NotificationService] Updated Firebase progress for job ${jobId}: ${update.progress}%`);
        } catch (error) {
            logger.error(`[NotificationService] Failed to update Firebase for job ${jobId}:`, error);
        }
    }

    /**
     * Sends a push notification to the user via FCM.
     */
    public async sendUserUpdate(userId: string, title: string, body: string, data?: any): Promise<void> {
        if (!this.messaging) return;

        try {
            const topic = `user_${userId}`;
            
            const message = {
                notification: { title, body },
                data: data || {},
                topic: topic
            };

            await this.messaging.send(message);
            logger.info(`[NotificationService] Sent FCM notification to topic ${topic}`);
        } catch (error) {
            logger.error(`[NotificationService] Failed to send FCM notification:`, error);
        }
    }
}
