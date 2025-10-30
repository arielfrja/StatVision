import { Router } from 'express';
import { DataSource } from 'typeorm';
import { GameEventRepository } from '../repository/GameEventRepository';
import { GameEvent } from '../GameEvent';
import { Game, GameStatus } from '../Game';
import { User } from '../User';
import { GameService } from '../service/GameService';
import { GameStatsService } from '../service/GameStatsService';
import logger from '../config/logger';

const router = Router();

export const gameRoutes = (AppDataSource: DataSource, gameService: GameService, gameStatsService: GameStatsService) => {
    const gameRepository = AppDataSource.getRepository(Game);
    const gameEventRepository = new GameEventRepository(AppDataSource);
    const userRepository = AppDataSource.getRepository(User);

    /**
     * @swagger
     * /games:
     *   get:
     *     summary: Get all games for the authenticated user.
     *     description: Retrieves a list of all game records associated with the authenticated user, ordered by upload date.
     *     tags: [Game]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: A list of games.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Game'
     *       401:
     *         description: Unauthorized.
     */
    router.get("/", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        try {
            const games = await gameService.getGamesForUser(req.user.uid);
            res.status(200).json(games);
        } catch (error) {
            logger.error("Error retrieving games for user:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    /**
     * @swagger
     * /games/{gameId}:
     *   get:
     *     summary: Get a single game with all details and events.
     *     description: Retrieves a specific game record, including all associated GameEvents, Teams, and Players.
     *     tags: [Game]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: gameId
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: The ID of the game to retrieve.
     *     responses:
     *       200:
     *         description: The game details.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Game not found or does not belong to user.
     */
    router.get("/:gameId", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;

        try {
            const game = await gameService.getGameDetails(req.user.uid, gameId);

            if (!game) {
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            res.status(200).json(game);
        } catch (error) {
            logger.error(`Error retrieving game ${gameId} details:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    // Temporary test endpoint for BE-304
    /**
     * @swagger
     * /games/test-batch-insert:
     *   post:
     *     summary: TEMPORARY - Tests batch insertion of GameEvents.
     *     description: Requires a valid Game ID and an array of GameEvent objects.
     *     tags: [Game]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               gameId:
     *                 type: string
     *                 format: uuid
     *               events:
     *                 type: array
     *                 items:
     *                   $ref: '#/components/schemas/GameEvent'
     *     responses:
     *       201:
     *         description: Successfully inserted GameEvents.
     *       400:
     *         description: Invalid request body.
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Game not found or does not belong to user.
     */
    router.post("/test-batch-insert", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId, events } = req.body;

        if (!gameId || !events || !Array.isArray(events)) {
            return res.status(400).json({ message: "Missing gameId or events array in body." });
        }

        try {
            // 1a. Get the internal User UUID from the Auth0 UID
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user) {
                return res.status(404).json({ message: "User record not found in local database." });
            }
            const userUuid = user.id;

            // 1b. Ensure the game exists and belongs to the user (basic check)
            const game = await gameRepository.findOne({ where: { id: gameId, userId: userUuid } });
            if (!game) {
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            // 2. Prepare GameEvent entities
            const gameEventsToInsert = events.map((event: any) => {
                const newEvent = new GameEvent();
                Object.assign(newEvent, event);
                newEvent.gameId = gameId;
                return newEvent;
            });

            // 3. Perform batch insert (BE-304)
            await gameEventRepository.batchInsert(gameEventsToInsert);

            // 4. Calculate and store stats (BE-305.1)
            await gameStatsService.calculateAndStoreStats(gameId);

            res.status(201).json({ message: `Successfully inserted ${gameEventsToInsert.length} game events and calculated stats.` });
        } catch (error) {
            logger.error("Error during batch insert test:", error);
            res.status(500).json({ message: "Internal server error during batch insert test." });
        }
    });

    return router;
};