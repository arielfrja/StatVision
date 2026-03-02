import { Router } from 'express';
import { DataSource } from 'typeorm';
import { GameEventRepository } from '../repository/GameEventRepository';
import { GameEvent } from '../core/entities/GameEvent';
import { Game, GameStatus } from '../core/entities/Game';
import { User } from '../core/entities/User';
import { GameService } from '../modules/games/GameService';
import { GameAssignmentService } from '../modules/games/GameAssignmentService';
import { GameAnalysisService } from '../modules/games/GameAnalysisService';
import { GameStatsService } from '../service/GameStatsService';
import logger from '../config/logger';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { IEventBus } from '../core/interfaces/IEventBus';

const UPLOAD_DIR = '/data/data/com.termux/files/home/data/development/StatVision/uploads';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Use a unique name, e.g., gameId-originalName
        const gameId = req.body.gameId || Date.now(); // Fallback if gameId is not provided in body
        cb(null, `${gameId}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

const router = Router();

const VIDEO_UPLOAD_TOPIC_NAME = process.env.VIDEO_UPLOAD_TOPIC_NAME || 'video-upload-events';

export const gameRoutes = (
    AppDataSource: DataSource, 
    gameService: GameService, 
    gameStatsService: GameStatsService, 
    gameEventRepository: GameEventRepository,
    gameAssignmentService: GameAssignmentService,
    gameAnalysisService: GameAnalysisService,
    eventBus: IEventBus
) => {
    const gameRepository = AppDataSource.getRepository(Game);
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
     * /games:
     *   post:
     *     summary: Create a new game record.
     *     description: Creates a new game record with an initial status, typically before a video file is uploaded.
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
     *               name:
     *                 type: string
     *                 description: The user-provided name for the game.
     *               gameDate:
     *                 type: string
     *                 format: date
     *                 description: The date the game was played (optional).
     *               location:
     *                 type: string
     *                 description: The location where the game was played (optional).
     *               season:
     *                 type: string
     *                 description: The season or league name (optional).
     *               homeTeamId:
     *                 type: string
     *                 format: uuid
     *                 description: The ID of the user's home team (optional).
     *               awayTeamId:
     *                 type: string
     *                 format: uuid
     *                 description: The ID of the user's away team (optional).
     *     responses: 
     *       201:
     *         description: Game created successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Game'
     *       400:
     *         description: Invalid request body.
     *       401:
     *         description: Unauthorized.
     *       500:
     *         description: Internal server error.
     */
    router.post("/", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        const { name, gameDate, location, season, homeTeamId, awayTeamId, visualContext, gameType, identityMode, ruleset } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Missing game name in body." });
        }

        try {
            const newGame = await gameService.createGame(req.user.uid, {
                name,
                gameDate,
                location,
                season,
                homeTeamId,
                awayTeamId,
                visualContext,
                gameType,
                identityMode,
                ruleset
            });
            res.status(201).json(newGame);
        } catch (error) {
            logger.error("Error creating new game:", error);
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

    /**
     * @swagger
     * /games/{gameId}/identified-entities:
     *   get:
     *     summary: Get all unique teams and players identified in a game's events.
     *     description: Retrieves a list of all unique teams and players that have been assigned to at least one GameEvent within a specific game.
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
     *         description: The ID of the game to retrieve entities from.
     *     responses:
     *       200:
     *         description: An object containing arrays of identified teams and players.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 teams:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Team'
     *                 players:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Player'
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Game not found or does not belong to user.
     */
    router.get("/:gameId/identified-entities", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;

        try {
            // First, verify the user has access to this game
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }
            const game = await gameRepository.findOne({ where: { id: gameId, userId: user.id } });
            if (!game) {
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            // If access is verified, get the identified entities
            const entities = await gameAnalysisService.getIdentifiedEntities(gameId);
            res.status(200).json(entities);
        } catch (error) {
            logger.error(`Error retrieving identified entities for game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    /**
     * @swagger
     * /games/{gameId}/assignment:
     *   post:
     *     summary: Assign identified teams and players to official ones.
     *     description: Updates GameEvent records with official team and player IDs and recalculates game statistics.
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
     *         description: The ID of the game to perform assignments for.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               teamMappings:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     tempTeamId: { type: 'string', format: 'uuid' }
     *                     officialTeamId: { type: 'string', format: 'uuid' }
     *               playerMappings:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     tempPlayerId: { type: 'string', format: 'uuid' }
     *                     officialPlayerId: { type: 'string', format: 'uuid' }
     *     responses:
     *       200:
     *         description: Assignments successful and stats recalculated.
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Game not found or does not belong to user.
     *       500:
     *         description: Internal server error.
     */
    router.post("/:gameId/assignment", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;
        const { teamMappings, playerMappings } = req.body;

        try {
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user) {
                return res.status(404).json({ message: "User record not found in local database." });
            }
            const userUuid = user.id;

            const game = await gameRepository.findOne({ where: { id: gameId, userId: userUuid } });
            if (!game) {
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            await gameAssignmentService.assignEntities(gameId, { teamMappings, playerMappings });

            res.status(200).json({ message: "Assignments successful and stats recalculated." });
        } catch (error) {
            logger.error(`Error during entity assignment for game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });


    /**
     * @swagger
     * /game-events/{gameEventId}/assign-player:
     *   put:
     *     summary: Assign a player to a game event.
     *     description: Assigns a player to a specific game event by updating its assignedPlayerId.
     *     tags: [Game Event]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: gameEventId
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: The ID of the game event to update.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               playerId:
     *                 type: string
     *                 format: uuid
     *                 nullable: true
     *                 description: The ID of the player to assign, or null to unassign.
     *     responses:
     *       200:
     *         description: Player assigned successfully.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/GameEvent'
     *       400:
     *         description: Invalid request body.
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Game event not found.
     *       500:
     *         description: Internal server error.
     */
    router.put("/game-events/:gameEventId/assign-player", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        const { gameEventId } = req.params;
        const { playerId } = req.body;

        if (playerId !== null && typeof playerId !== 'string' && typeof playerId !== 'undefined') {
            return res.status(400).json({ message: "Invalid playerId. Must be a string (UUID) or null." });
        }

        try {
            const gameEvent = await gameEventRepository.findOne({ where: { id: gameEventId }, relations: ["game"] });

            if (!gameEvent) {
                return res.status(404).json({ message: "Game event not found." });
            }

            // Ensure the game event belongs to a game owned by the authenticated user
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user || gameEvent.game.userId !== user.id) {
                return res.status(401).json({ message: "Unauthorized to modify this game event." });
            }

            gameEvent.assignedPlayerId = playerId;
            await gameEventRepository.save(gameEvent);

            // Recalculate stats after assignment
            await gameStatsService.calculateAndStoreStats(gameEvent.gameId);

            res.status(200).json(gameEvent);
        } catch (error) {
            logger.error(`Error assigning player to game event ${gameEventId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    /**
     * @swagger
     * /game-events/{gameEventId}:
     *   put:
     *     summary: Update a game event.
     *     description: Updates details of a specific game event and recalculates game statistics.
     *     tags: [Game Event]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: gameEventId
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               eventType: { type: 'string' }
     *               assignedTeamId: { type: 'string', format: 'uuid', nullable: true }
     *               assignedPlayerId: { type: 'string', format: 'uuid', nullable: true }
     *     responses:
     *       200: { description: 'Event updated successfully.' }
     */
    router.put("/game-events/:gameEventId", async (req, res) => {
        if (!req.user || !req.user.uid) return res.status(401).send("Unauthorized");
        const { gameEventId } = req.params;
        const { eventType, assignedTeamId, assignedPlayerId } = req.body;

        try {
            const gameEvent = await gameEventRepository.findOne({ where: { id: gameEventId }, relations: ["game"] });
            if (!gameEvent) return res.status(404).json({ message: "Event not found." });

            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user || gameEvent.game.userId !== user.id) return res.status(401).send("Unauthorized");

            if (eventType) gameEvent.eventType = eventType;
            gameEvent.assignedTeamId = assignedTeamId || null;
            gameEvent.assignedPlayerId = assignedPlayerId || null;

            await gameEventRepository.save(gameEvent);
            await gameStatsService.calculateAndStoreStats(gameEvent.gameId);

            res.status(200).json(gameEvent);
        } catch (error) {
            logger.error(`Error updating event ${gameEventId}:`, error);
            res.status(500).send("Internal server error.");
        }
    });

    /**
     * @swagger
     * /game-events/{gameEventId}:
     *   delete:
     *     summary: Delete a game event.
     *     tags: [Game Event]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       204: { description: 'Event deleted successfully.' }
     */
    router.delete("/game-events/:gameEventId", async (req, res) => {
        if (!req.user || !req.user.uid) return res.status(401).send("Unauthorized");
        const { gameEventId } = req.params;

        try {
            const gameEvent = await gameEventRepository.findOne({ where: { id: gameEventId }, relations: ["game"] });
            if (!gameEvent) return res.status(404).json({ message: "Event not found." });

            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user || gameEvent.game.userId !== user.id) return res.status(401).send("Unauthorized");

            const gameId = gameEvent.gameId;
            await gameEventRepository.remove(gameEvent);
            await gameStatsService.calculateAndStoreStats(gameId);

            res.status(204).send();
        } catch (error) {
            logger.error(`Error deleting event ${gameEventId}:`, error);
            res.status(500).send("Internal server error.");
        }
    });

    /**
     * @swagger
     * /games/upload:
     *   post:
     *     summary: Upload a video file for game analysis.
     *     description: Handles the direct upload of a video file to the local server filesystem.
     *     tags: [Game]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               video:
     *                 type: string
     *                 format: binary
     *                 description: The video file to upload.
     *               gameId:
     *                 type: string
     *                 format: uuid
     *                 description: The ID of the game record created prior to upload.
     *     responses:
     *       200:
     *         description: File uploaded successfully.
     *       401:
     *         description: Unauthorized.
     *       500:
     *         description: Internal server error.
     */
    router.post("/upload", upload.single('video'), async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const { gameId } = req.body;
        const filePath = req.file.path;

        try {
            // 1. Ensure the game exists and belongs to the user (basic check)
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user) {
                // Clean up the uploaded file if the user record is missing
                await fs.promises.unlink(filePath);
                return res.status(404).json({ message: "User record not found in local database." });
            }
            const userUuid = user.id;

            const game = await gameRepository.findOne({ where: { id: gameId, userId: userUuid } });
            if (!game) {
                // Clean up the uploaded file if the game record is missing
                await fs.promises.unlink(filePath);
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            // 2. Update the game record with the file path and set status to UPLOADED
            await gameService.updateGameFilePathAndStatus(gameId, filePath, GameStatus.UPLOADED);

            // 3. Publish a message to Pub/Sub for the worker service to pick up (BE-306)
            await publishVideoUploadEvent(gameId, filePath, userUuid);

            res.status(200).json({
                message: "File uploaded successfully. Processing will begin shortly.",
                filePath: filePath,
                gameId: gameId
            });
        } catch (error) {
            logger.error("Error during file upload and game update:", error);
            // Attempt to clean up the file on error
            if (filePath) {
                try {
                    await fs.promises.unlink(filePath);
                } catch (cleanupError) {
                    logger.error("Failed to clean up uploaded file after error:", cleanupError);
                }
            }
            res.status(500).json({ message: "Internal server error." });
        }
    });

    // Pub/Sub publishing function
    async function publishVideoUploadEvent(gameId: string, filePath: string, userId: string) {
        const messageData = {
            gameId,
            filePath,
            userId,
        };

        try {
            await eventBus.publish(VIDEO_UPLOAD_TOPIC_NAME, messageData);
            logger.info(`Published video upload event for Game ID: ${gameId} to topic ${VIDEO_UPLOAD_TOPIC_NAME}.`);
        } catch (error) {
            logger.error(`Failed to publish video upload event for Game ID: ${gameId}:`, error);
            throw new Error(`Pub/Sub publishing failed: ${(error as any).message}`, { cause: error });
        }
    }

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
    /**
     * @swagger
     * /games/{gameId}:
     *   delete:
     *     summary: Delete a game and all its associated data.
     *     description: Deletes a specific game record, including all associated events, stats, and the uploaded video file.
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
     *         description: The ID of the game to delete.
     *     responses:
     *       204:
     *         description: Game deleted successfully. No content.
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Game not found or does not belong to user.
     *       500:
     *         description: Internal server error.
     */
    router.delete("/:gameId", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;

        try {
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user) {
                return res.status(404).json({ message: "User record not found in local database." });
            }
            const userUuid = user.id;

            const game = await gameRepository.findOne({ where: { id: gameId, userId: userUuid } });
            if (!game) {
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            await gameService.deleteGame(gameId, userUuid);
            res.status(204).send(); // No content for successful deletion
        } catch (error) {
            logger.error(`Error deleting game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

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

    /**
     * @swagger
     * /games/{gameId}/retry:
     *   post:
     *     summary: Retries analysis for a game with ANALYSIS_FAILED_RETRYABLE status.
     *     description: Re-queues a game for video analysis if its status is ANALYSIS_FAILED_RETRYABLE.
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
     *         description: The ID of the game to retry.
     *     responses:
     *       200:
     *         description: Game re-queued for analysis.
     *       401:
     *         description: Unauthorized.
     *       404:
     *         description: Game not found or does not belong to user.
     *       409:
     *         description: Game is not in ANALYSIS_FAILED_RETRYABLE status.
     *       500:
     *         description: Internal server error.
     */
    router.post("/:gameId/retry", async (req, res) => {
        if (!req.user || !req.user.uid) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;

        try {
            const user = await userRepository.findOne({ where: { providerUid: req.user.uid } });
            if (!user) {
                return res.status(404).json({ message: "User record not found in local database." });
            }
            const userUuid = user.id;

            const game = await gameRepository.findOne({ where: { id: gameId, userId: userUuid } });
            if (!game) {
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            if (game.status !== GameStatus.ANALYSIS_FAILED_RETRYABLE) {
                return res.status(409).json({ message: `Game ${gameId} is not in ANALYSIS_FAILED_RETRYABLE status. Current status: ${game.status}` });
            }

            if (!game.filePath) {
                return res.status(400).json({ message: `Game ${gameId} does not have a file path associated. Cannot retry.` });
            }

            // Re-publish the original message to Pub/Sub
            await publishVideoUploadEvent(gameId, game.filePath, userUuid);

            // Update game status to PROCESSING
            await gameService.updateGameStatus(gameId, GameStatus.PROCESSING);

            res.status(200).json({ message: `Game ${gameId} re-queued for analysis.` });

        } catch (error) {
            logger.error(`Error retrying game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    return router;
};