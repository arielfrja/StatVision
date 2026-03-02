import { Router } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../User';
import { PlayerService } from '../service/PlayerService';
import logger from '../config/logger';

export const playerGlobalRoutes = (AppDataSource: DataSource, playerService: PlayerService) => {
    const router = Router();
    const userRepository = AppDataSource.getRepository(User);

    /**
     * @swagger
     * /players:
     *   get:
     *     summary: Get all players for the authenticated user (across all teams).
     *     description: Retrieves a list of all PlayerTeamHistory records associated with any team owned by the user.
     *     tags: [Players]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: A list of PlayerTeamHistory records.
     *       401:
     *         description: Unauthorized.
     *       500:
     *         description: Internal server error.
     */
    router.get("/", async (req, res) => {
        try {
            const providerUid = req.user?.uid;
            if (!providerUid) {
                return res.status(401).send("Unauthorized: User ID not found.");
            }
            const user = await userRepository.findOneBy({ providerUid });
            if (!user) {
                return res.status(404).send("User not found in database.");
            }
            logger.info(`User ${user.id} fetching all their players.`);
            const players = await playerService.getPlayersByUser(user.id);
            logger.info(`User ${user.id} fetched ${players.length} players.`);
            res.status(200).json(players);
        } catch (error: any) {
            logger.error("Error fetching all players for user:", error);
            res.status(500).send("Internal server error fetching players.");
        }
    });

    /**
     * @swagger
     * /players/{playerId}/switch-team:
     *   put:
     *     summary: Switch a player to the opposing team for a specific game.
     *     description: Swaps the teamId for all GameEvents and GamePlayerStats for a player within a single game.
     *     tags: [Players]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: playerId
     *         schema: { type: 'string', format: 'uuid' }
     *         required: true
     *       - in: body
     *         name: gameId
     *         schema: { type: 'object', properties: { gameId: { type: 'string', format: 'uuid' } } }
     *         required: true
     *     responses:
     *       200: { description: 'Team switched successfully.' }
     */
    router.put("/:playerId/switch-team", async (req, res) => {
        const { playerId } = req.params;
        const { gameId } = req.body;

        try {
            const providerUid = req.user?.uid;
            if (!providerUid) return res.status(401).send("Unauthorized");
            const user = await userRepository.findOneBy({ providerUid });
            if (!user) return res.status(404).send("User not found");

            await playerService.switchPlayerTeam(playerId, gameId, user.id);
            res.status(200).json({ message: "Team switched successfully and stats recalculated." });
        } catch (error: any) {
            logger.error(`Error switching team for player ${playerId}:`, error);
            res.status(400).send(error.message);
        }
    });

    return router;
};
