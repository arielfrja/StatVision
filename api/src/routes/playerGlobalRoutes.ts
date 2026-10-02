import { Router } from 'express';
import { DataSource } from 'typeorm';
import { PlayerService, GameStatsService, Game, GameEvent, GamePlayerStats } from '@statvision/common';
import logger from '../config/logger';

export const playerGlobalRoutes = (AppDataSource: DataSource, playerService: PlayerService, gameStatsService: GameStatsService) => {
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

    // Move a player's game-scoped attribution to the other side
    // (home <-> away). Updates the player's events + stat row, then
    // recalculates. No PlayerTeamHistory writes (temporal rosters are
    // out of scope by founder decision; linkage stays derived).
    router.put("/:playerId/switch-team", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { playerId } = req.params;
        const { gameId } = req.body;
        if (!gameId) {
            return res.status(400).json({ message: "gameId is required." });
        }

        try {
            const game = await AppDataSource.getRepository(Game).findOne({
                where: { id: gameId, userId: req.user.id },
            });
            if (!game) {
                return res.status(404).json({ message: "Game not found or access denied." });
            }
            if (!game.homeTeamId || !game.awayTeamId) {
                return res.status(400).json({ message: "Game needs both teams linked before switching sides." });
            }

            const statRow = await AppDataSource.getRepository(GamePlayerStats).findOne({
                where: { gameId, playerId },
            });
            const eventRows = await AppDataSource.getRepository(GameEvent).find({
                where: { gameId, assignedPlayerId: playerId },
                select: ['id', 'assignedTeamId'],
            });
            const votes = new Map<string, number>();
            if (statRow?.teamId) votes.set(statRow.teamId, 1 << 30);
            for (const e of eventRows) {
                if (e.assignedTeamId) votes.set(e.assignedTeamId, (votes.get(e.assignedTeamId) || 0) + 1);
            }
            if (votes.size === 0) {
                return res.status(400).json({ message: "Player has no attribution in this game." });
            }
            const fromTeamId = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
            if (fromTeamId !== game.homeTeamId && fromTeamId !== game.awayTeamId) {
                return res.status(400).json({ message: "Player is not on either game side." });
            }
            const toTeamId = fromTeamId === game.homeTeamId ? game.awayTeamId : game.homeTeamId;

            await AppDataSource.getRepository(GameEvent).update(
                { gameId, assignedPlayerId: playerId },
                { assignedTeamId: toTeamId }
            );
            if (statRow) {
                statRow.teamId = toTeamId;
                await AppDataSource.getRepository(GamePlayerStats).save(statRow);
            }
            await gameStatsService.calculateAndStoreStats(gameId);

            res.status(200).json({ playerId, fromTeamId, toTeamId, movedEvents: eventRows.length });
        } catch (error) {
            logger.error(`Error switching team for player ${playerId} in game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    return router;
};
