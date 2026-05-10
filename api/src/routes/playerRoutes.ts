import { Router, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { TeamService, PlayerService } from '@statvision/common';
import logger from '../config/logger';

export const playerRoutes = (AppDataSource: DataSource, teamService: TeamService, playerService: PlayerService) => {
    const router = Router({ mergeParams: true });

    router.get("/", async (req: Request, res: Response) => {
        if (!req.user || !req.user.uid) return res.status(401).send("Unauthorized");
        const teamId = req.params.teamId as string;

        try {
            const team = await teamService.getTeamByIdAndUser(teamId, req.user.uid);
            if (!team) return res.status(404).json({ message: "Team not found." });

            const players = await playerService.getPlayersByTeam(teamId);
            res.status(200).json(players);
        } catch (error) {
            logger.error(`Error retrieving players for team ${teamId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.post("/", async (req: Request, res: Response) => {
        if (!req.user || !req.user.uid) return res.status(401).send("Unauthorized");
        const teamId = req.params.teamId as string;
        const { name, jerseyNumber, description } = req.body;

        try {
            const team = await teamService.getTeamByIdAndUser(teamId, req.user.uid);
            if (!team) return res.status(404).json({ message: "Team not found." });

            const newPlayerHistory = await playerService.createPlayerAndAssignToTeam(name, teamId, jerseyNumber, description);
            res.status(201).json(newPlayerHistory);
        } catch (error) {
            logger.error(`Error creating player for team ${teamId}:`, error);
            res.status(500).json({ message: (error as Error).message });
        }
    });

    return router;
};
