import { Router } from 'express';
import { AiUsageService } from '@statvision/common';
import logger from '../config/logger';

export const usageRoutes = (aiUsageService: AiUsageService) => {
    const router = Router();

    /**
     * @swagger
     * /usage/summary:
     *   get:
     *     summary: Get AI usage summary
     *     tags: [Usage]
     *     parameters:
     *       - in: query
     *         name: start
     *         schema:
     *           type: string
     *           format: date-time
     *       - in: query
     *         name: end
     *         schema:
     *           type: string
     *           format: date-time
     *     responses:
     *       200:
     *         description: Usage summary retrieved successfully
     */
    router.get('/summary', async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = req.query.end ? new Date(req.query.end as string) : new Date();

            const summary = await aiUsageService.getUsageSummary(userId, start, end);
            res.json(summary);
        } catch (error) {
            next(error);
        }
    });

    /**
     * @swagger
     * /usage/daily:
     *   get:
     *     summary: Get daily AI usage
     *     tags: [Usage]
     *     parameters:
     *       - in: query
     *         name: start
     *         schema:
     *           type: string
     *           format: date-time
     *       - in: query
     *         name: end
     *         schema:
     *           type: string
     *           format: date-time
     *     responses:
     *       200:
     *         description: Daily usage retrieved successfully
     */
    router.get('/daily', async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = req.query.end ? new Date(req.query.end as string) : new Date();

            const dailyUsage = await aiUsageService.getDailyUsage(userId, start, end);
            res.json(dailyUsage);
        } catch (error) {
            next(error);
        }
    });

    return router;
};
