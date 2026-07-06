import { Router } from "express";
import { AppContainer } from "../shared/AppContainer";
import { VideoAnalysisResultService, VideoAnalysisJobResultMessage } from "../service/VideoAnalysisResultService";
import { NotificationService } from "../service/NotificationService";
import { JobWatchdogService } from "../service/JobWatchdogService";
import logger from "../config/logger";
import { OAuth2Client } from "google-auth-library";

const router = Router();
const authClient = new OAuth2Client();

/**
 * Middleware to verify that the request came from Google Cloud (OIDC).
 */
async function verifyGoogleOidc(req: any, res: any, next: any) {
    if (process.env.NODE_ENV !== 'production') return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Missing OIDC token');
    }

    const token = authHeader.split(' ')[1];
    try {
        const ticket = await authClient.verifyIdToken({
            idToken: token,
            audience: process.env.WEBHOOK_AUDIENCE || 'statvision-webhooks'
        });
        req.googleServiceAccount = ticket.getPayload();
        next();
    } catch (error) {
        logger.error('[WebhookSecurity] Invalid OIDC token:', error);
        res.status(403).send('Unauthorized service-to-service call');
    }
}

/**
 * POST /api/webhooks/results
 * Handled by Pub/Sub Push for final results and chunk results.
 */
router.post("/results", verifyGoogleOidc, async (req, res) => {
    const container = AppContainer.getInstance(null as any);
    const service = container.get<VideoAnalysisResultService>(VideoAnalysisResultService);

    try {
        const pubsubMessage = req.body.message;
        if (!pubsubMessage || !pubsubMessage.data) return res.status(400).send('Invalid Format');

        const result = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString()) as VideoAnalysisJobResultMessage;
        await service.handlePushMessage(result);

        res.status(200).send('OK');
    } catch (error: any) {
        logger.error(`[Webhook_ERROR] Results webhook failed: ${error.message}`);
        res.status(500).send('Retry');
    }
});

/**
 * POST /api/webhooks/progress
 * Handled by Pub/Sub Push for real-time progress updates.
 */
router.post("/progress", verifyGoogleOidc, async (req, res) => {
    const container = AppContainer.getInstance(null as any);
    const notificationService = container.get<NotificationService>(NotificationService);

    try {
        const pubsubMessage = req.body.message;
        if (!pubsubMessage || !pubsubMessage.data) return res.status(400).send('Invalid Format');

        const update = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
        
        // Sync to Firebase
        await notificationService.updateJobProgress(update.jobId, {
            progress: update.progress,
            status: update.currentPhase,
            details: update.details,
            gameId: update.gameId
        });

        res.status(200).send('OK');
    } catch (error: any) {
        logger.error(`[Webhook_ERROR] Progress webhook failed: ${error.message}`);
        res.status(500).send('Retry');
    }
});

/**
 * GET /api/webhooks/watchdog
 * Handled by Cloud Scheduler.
 */
router.get("/watchdog", verifyGoogleOidc, async (req, res) => {
    const container = AppContainer.getInstance(null as any);
    const watchdog = container.get<JobWatchdogService>(JobWatchdogService);

    try {
        const stats = await watchdog.checkStaleJobs();
        res.status(200).json(stats);
    } catch (error: any) {
        logger.error(`[Webhook_ERROR] Watchdog failed: ${error.message}`);
        res.status(500).send('Retry');
    }
});

export const webhookRoutes = router;
