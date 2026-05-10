import { Router } from 'express';
import { DataSource } from 'typeorm';
import { TeamService, User } from '@statvision/common';
import logger from '../config/logger';

export const teamRoutes = (AppDataSource: DataSource, teamService: TeamService) => {
    const router = Router();
    const userRepository = AppDataSource.getRepository(User);

    router.get("/", async (req, res) => {
        if (!req.user || !req.user.uid) return res.status(401).send("Unauthorized");
        try {
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user) return res.status(404).send();
            const teams = await teamService.getTeamsByUser(user.id);
            res.status(200).json(teams);
        } catch (error) {
            logger.error("Error retrieving teams:", error);
            res.status(500).send("Internal server error.");
        }
    });

    router.post("/", async (req, res) => {
        if (!req.user || !req.user.uid) return res.status(401).send("Unauthorized");
        const { name } = req.body;
        try {
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user) return res.status(404).send();
            const newTeam = await teamService.createTeam(name, user);
            res.status(201).json(newTeam);
        } catch (error) {
            logger.error("Error creating team:", error);
            res.status(500).json({ message: (error as Error).message });
        }
    });

    return router;
};
