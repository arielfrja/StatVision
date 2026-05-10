import { Router } from 'express';
import { DataSource } from 'typeorm';
import { PlayerService } from '@statvision/common';
import logger from '../config/logger';

export const playerGlobalRoutes = (AppDataSource: DataSource, playerService: PlayerService) => {
    const router = Router();

    router.get("/", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        try {
            const players = await playerService.getPlayersByUser(req.user.uid);
            res.status(200).json(players);
        } catch (error) {
            logger.error("Error retrieving players for user:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    return router;
};
