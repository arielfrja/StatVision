import { Router } from 'express';
import { DataSource } from 'typeorm';
import { TeamService, User, PlayerService } from '@statvision/common';
import logger from '../config/logger';
import { playerRoutes } from './playerRoutes';

export const teamRoutes = (AppDataSource: DataSource, teamService: TeamService, playerService: PlayerService) => {
    const router = Router();

    // Mount player routes under /teams/:teamId/players
    router.use("/:teamId/players", playerRoutes(AppDataSource, teamService, playerService));

    router.get("/", async (req, res) => {
        if (!req.user || !req.user.id) return res.status(401).send("Unauthorized");
        try {
            const teams = await teamService.getTeamsByUser(req.user.id);
            res.status(200).json(teams);
        } catch (error) {
            logger.error("Error retrieving teams:", error);
            res.status(500).send("Internal server error.");
        }
    });

    router.post("/", async (req, res) => {
        if (!req.user || !req.user.id) return res.status(401).send("Unauthorized");
        const { name } = req.body;
        try {
            // Need User object for createTeam
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOneBy({ id: req.user.id });
            if (!user) return res.status(404).send();
            
            const newTeam = await teamService.createTeam(name, user);
            res.status(201).json(newTeam);
        } catch (error) {
            logger.error("Error creating team:", error);
            res.status(500).json({ message: (error as Error).message });
        }
    });

    router.get("/:teamId", async (req, res) => {
        if (!req.user || !req.user.id) return res.status(401).send("Unauthorized");
        const { teamId } = req.params;
        try {
            const team = await teamService.getTeamByIdAndUser(teamId, req.user.id);
            if (!team) return res.status(404).json({ message: "Team not found." });
            res.status(200).json(team);
        } catch (error) {
            logger.error(`Error retrieving team ${teamId}:`, error);
            res.status(500).json({ message: (error as Error).message });
        }
    });

    router.put("/:teamId", async (req, res) => {
        if (!req.user || !req.user.id) return res.status(401).send("Unauthorized");
        const { teamId } = req.params;
        const { name } = req.body;
        try {
            const updatedTeam = await teamService.updateTeam(teamId, req.user.id, name);
            res.status(200).json(updatedTeam);
        } catch (error) {
            logger.error(`Error updating team ${teamId}:`, error);
            res.status(500).json({ message: (error as Error).message });
        }
    });

    return router;
};
