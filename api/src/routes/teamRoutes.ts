import { Router } from 'express';
import { DataSource } from 'typeorm';
import { TeamService, User, PlayerService, Game, PlayerTeamHistory } from '@statvision/common';
import logger from '../config/logger';
import { playerRoutes } from './playerRoutes';

const mapTeamError = (error: unknown): { status: number; message: string } => {
    const message = (error as Error)?.message || "Internal server error.";
    const code = (error as Error & { code?: string })?.code;
    if (code === "DUPLICATE_TEAM_NAME" || message === "Team name already exists.") {
        return { status: 409, message };
    }
    if (message === "Team name cannot be empty.") {
        return { status: 400, message };
    }
    if (message.includes("not found") || message.includes("do not have permission")) {
        return { status: 404, message };
    }
    return { status: 500, message };
};

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
            const { status, message } = mapTeamError(error);
            res.status(status).json({ message });
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
            const { status, message } = mapTeamError(error);
            res.status(status).json({ message });
        }
    });

    router.delete("/:teamId", async (req, res) => {
        if (!req.user || !req.user.id) return res.status(401).send("Unauthorized");
        const { teamId } = req.params;
        try {
            const team = await teamService.getTeamByIdAndUser(teamId, req.user.id);
            if (!team) return res.status(404).json({ message: "Team not found." });

            // Refuse (don't cascade-delete) squads that still hold players:
            // releasing is explicit via DELETE /teams/:id/players/:pid, so a
            // misclick can never silently wipe a roster.
            const rosterCount = await AppDataSource.getRepository(PlayerTeamHistory).count({
                where: { teamId },
            });
            if (rosterCount > 0) {
                return res.status(409).json({
                    message: `Squad still holds ${rosterCount} player(s). Release them first, then delete.`,
                    rosterCount,
                });
            }

            // Guard: games referencing this team keep working after delete.
            // The home/away FKs are SET NULL, but we nullify explicitly first so the
            // response can confirm the outcome and no orphaned link survives.
            const gameRepository = AppDataSource.getRepository(Game);
            await gameRepository.update({ homeTeamId: teamId }, { homeTeamId: null as unknown as string });
            await gameRepository.update({ awayTeamId: teamId }, { awayTeamId: null as unknown as string });

            await teamService.deleteTeam(teamId, req.user.id);
            res.status(200).json({ message: "Team deleted.", id: teamId });
        } catch (error) {
            logger.error(`Error deleting team ${teamId}:`, error);
            const { status, message } = mapTeamError(error);
            res.status(status).json({ message });
        }
    });

    return router;
};
