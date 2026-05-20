import { Router } from 'express';
import { DataSource } from 'typeorm';
import { CloudTasksClient } from '@google-cloud/tasks';
import { 
    GameEventRepository, GameStatsService, GameStatus, GameEvent, Game, User, IEventBus,
    IStorageProvider
} from '@statvision/common';
import { GameService } from '../modules/games/GameService';
import { GameAssignmentService } from '../modules/games/GameAssignmentService';
import { GameAnalysisService } from '../modules/games/GameAnalysisService';
import logger from '../config/logger';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

const tasksClient = new CloudTasksClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const gameId = req.body.gameId || Date.now();
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
    eventBus: IEventBus,
    storageProvider: IStorageProvider
) => {
    const gameRepository = AppDataSource.getRepository(Game);
    const userRepository = AppDataSource.getRepository(User);

    const queueOrchestrationTask = async (gameId: string, filePath: string, userId: string) => {
        const projectId = process.env.CLOUD_TASKS_PROJECT_ID || process.env.GCP_PROJECT_ID || 'statsvision-477017';
        const location = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
        const queue = process.env.ORCHESTRATOR_QUEUE_NAME || 'orchestrate-queue';
        const url = process.env.ORCHESTRATOR_URL || 'https://statvision-worker-test-chsbu3g4oa-uc.a.run.app/api/orchestrate-game';

        const parent = tasksClient.queuePath(projectId, location, queue);
        const payload = { gameId, filePath, userId };
        const task = {
            httpRequest: {
                httpMethod: 'POST' as const,
                url,
                headers: { 'Content-Type': 'application/json' },
                body: Buffer.from(JSON.stringify(payload)).toString('base64'),
                oidcToken: {
                    serviceAccountEmail: '515511056475-compute@developer.gserviceaccount.com',
                },
            },
        };

        try {
            await tasksClient.createTask({ parent, task });
            logger.info(`Cloud Task created for game orchestration: ${gameId}`);
        } catch (error) {
            logger.error(`Failed to create Cloud Task for game orchestration: ${gameId}`, error);
            throw error;
        }
    };

    const handleSuccessfulUpload = async (game: Game, localPath: string, userId: string) => {
        // 1. Upload to Cloud Storage
        const fileName = path.basename(localPath);
        const destinationPath = `videos/${game.id}/${fileName}`;
        const gcsUri = await storageProvider.uploadFile(localPath, destinationPath);

        // 2. Update game status and file path (GCS URI)
        game.status = GameStatus.UPLOADED;
        game.filePath = gcsUri;
        await gameRepository.save(game);

        // 3. Emit event with GCS URI
        await queueOrchestrationTask(game.id, gcsUri, userId);

        // 4. Cleanup local file
        try {
            fs.unlinkSync(localPath);
        } catch (cleanupErr) {
            logger.warn(`Failed to cleanup local file ${localPath}:`, cleanupErr);
        }

        return gcsUri;
    };

    router.get("/", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        try {
            const games = await gameService.getGamesByUser(req.user.id);
            res.status(200).json(games);
        } catch (error) {
            logger.error("Error retrieving games for user:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.post("/", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { name, gameDate, location, homeTeamId, awayTeamId, visualContext, gameType, identityMode, ruleset } = req.body;

        try {
            const user = await userRepository.findOneBy({ id: req.user.id });
            if (!user) return res.status(404).json({ message: "User not found" });

            const newGame = await gameService.createGame({
                name,
                homeTeamId,
                awayTeamId,
                gameDate,
                gameType,
                identityMode,
                visualContext,
                ruleset
            }, user);
            res.status(201).json(newGame);
        } catch (error) {
            logger.error("Error creating new game:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.patch("/:gameId", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;

        try {
            const updatedGame = await gameService.updateGame(gameId, req.user.id, req.body);
            if (!updatedGame) {
                return res.status(404).json({ message: "Game not found or access denied." });
            }
            res.status(200).json(updatedGame);
        } catch (error) {
            logger.error(`Error updating game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.get("/:gameId/upload-url", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;
        const { fileName, contentType } = req.query;

        if (!fileName || !contentType) {
            return res.status(400).json({ message: "Missing fileName or contentType query parameters." });
        }

        try {
            const game = await gameRepository.findOneBy({ id: gameId, userId: req.user.id });
            if (!game) {
                return res.status(404).json({ message: "Game not found or access denied." });
            }

            const destinationPath = `videos/${gameId}/${fileName}`;
            const uploadUrl = await storageProvider.getResumableUploadUrl(destinationPath, contentType as string);

            // Save the upload URL to the game record for persistence/resumption
            game.uploadUrl = uploadUrl;
            await gameRepository.save(game);

            res.status(200).json({ uploadUrl, gcsUri: `gs://${process.env.UPLOAD_BUCKET || 'statvision-uploads-prod'}/${destinationPath}` });
        } catch (error) {
            logger.error(`Error generating upload URL for game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    // Mock endpoint for local resumable uploads (used by LocalStorageProvider)
    router.put("/upload/local-mock-session", upload.single('file'), async (req, res) => {
        const { path: destinationPath } = req.query;
        const file = req.file;

        if (!destinationPath || !file) {
            return res.status(400).send("Missing path or file");
        }

        const storageDir = path.join(process.cwd(), '../storage');
        const targetPath = path.join(storageDir, destinationPath as string);
        const targetDir = path.dirname(targetPath);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        try {
            fs.renameSync(file.path, targetPath);
            res.status(200).send("OK");
        } catch (err) {
            logger.error(`Local mock upload failed:`, err);
            res.status(500).send("Internal error");
        }
    });

    router.post("/:gameId/upload-complete", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;
        const { gcsUri } = req.body;

        if (!gcsUri) {
            return res.status(400).json({ message: "Missing gcsUri in body." });
        }

        try {
            const game = await gameRepository.findOneBy({ id: gameId, userId: req.user.id });
            if (!game) {
                return res.status(404).json({ message: "Game not found or access denied." });
            }

            // Update game status and file path
            game.status = GameStatus.UPLOADED;
            game.filePath = gcsUri;
            await gameRepository.save(game);

            // Emit event to start analysis via Cloud Tasks
            await queueOrchestrationTask(game.id, gcsUri, req.user.id);

            logger.info(`Video upload confirmed and Cloud Task created for game ${gameId}: ${gcsUri}`);
            res.status(200).json({ message: "Upload confirmed. Analysis started.", game });
        } catch (error) {
            logger.error(`Error confirming upload for game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.get("/upload/status/:gameId", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;
        const chunksDir = path.join(UPLOAD_DIR, 'chunks', gameId);

        try {
            const game = await gameRepository.findOneBy({ id: gameId, userId: req.user.id });
            if (!game) {
                return res.status(404).json({ message: "Game not found or access denied." });
            }

            if (!fs.existsSync(chunksDir)) {
                return res.status(200).json({ chunksReceived: [] });
            }

            const files = fs.readdirSync(chunksDir);
            const chunksReceived = files
                .filter(f => f.startsWith('chunk-'))
                .map(f => parseInt(f.replace('chunk-', ''), 10))
                .sort((a, b) => a - b);

            res.status(200).json({ chunksReceived });
        } catch (error) {
            logger.error(`Error getting upload status for game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.post("/upload/chunk", upload.single('chunk'), async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId, chunkIndex, totalChunks, fileName } = req.body;
        const file = req.file;

        if (!gameId || !file || chunkIndex === undefined || !totalChunks) {
            return res.status(400).json({ message: "Missing required fields for chunked upload." });
        }

        const chunksDir = path.join(UPLOAD_DIR, 'chunks', gameId);
        if (!fs.existsSync(chunksDir)) {
            fs.mkdirSync(chunksDir, { recursive: true });
        }

        const chunkPath = path.join(chunksDir, `chunk-${chunkIndex}`);
        
        try {
            const game = await gameRepository.findOneBy({ id: gameId, userId: req.user.id });
            if (!game) {
                return res.status(404).json({ message: "Game not found or access denied." });
            }

            // Move the uploaded file to the chunks directory
            fs.renameSync(file.path, chunkPath);

            const files = fs.readdirSync(chunksDir);
            const chunkFiles = files.filter(f => f.startsWith('chunk-'));

            if (chunkFiles.length === parseInt(totalChunks, 10)) {
                // All chunks received, merge them
                const finalFileName = `${gameId}-${fileName || 'video.mp4'}`;
                const finalPath = path.join(UPLOAD_DIR, finalFileName);
                const writeStream = fs.createWriteStream(finalPath);

                logger.info(`Merging ${totalChunks} chunks for game ${gameId}...`);

                // Function to append a chunk to the write stream using promises for sequential flow
                const appendChunk = (index: number): Promise<void> => {
                    return new Promise((resolve, reject) => {
                        const currentChunkPath = path.join(chunksDir, `chunk-${index}`);
                        const readStream = fs.createReadStream(currentChunkPath);
                        readStream.pipe(writeStream, { end: false });
                        readStream.on('end', () => {
                            fs.unlinkSync(currentChunkPath);
                            resolve();
                        });
                        readStream.on('error', reject);
                    });
                };

                try {
                    for (let i = 0; i < parseInt(totalChunks, 10); i++) {
                        await appendChunk(i);
                    }
                    writeStream.end();

                    // Wait for write stream to finish
                    await new Promise((resolve, reject) => {
                        writeStream.on('finish', resolve);
                        writeStream.on('error', reject);
                    });

                    // Cleanup chunks directory
                    fs.rmdirSync(chunksDir);

                    // Move to GCS and Emit Event
                    const gcsUri = await handleSuccessfulUpload(game, finalPath, req.user.id);

                    logger.info(`Video assembled and uploaded to GCS for game ${gameId}: ${gcsUri}`);
                    return res.status(200).json({ message: "Upload complete. Analysis started.", game, status: 'COMPLETE' });
                } catch (mergeError) {
                    logger.error(`Error merging chunks for game ${gameId}:`, mergeError);
                    writeStream.end();
                    return res.status(500).json({ message: "Error assembling file segments." });
                }
            }

            res.status(200).json({ message: `Chunk ${chunkIndex} received.`, status: 'UPLOADING' });
        } catch (error) {
            logger.error(`Error during chunk upload for game ${gameId}, index ${chunkIndex}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.post("/upload", upload.single('video'), async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.body;
        const file = req.file;

        if (!gameId || !file) {
            return res.status(400).json({ message: "Missing gameId or video file." });
        }

        try {
            const game = await gameRepository.findOneBy({ id: gameId, userId: req.user.id });
            if (!game) {
                return res.status(404).json({ message: "Game not found or access denied." });
            }

            // Move to GCS and Emit Event
            const gcsUri = await handleSuccessfulUpload(game, file.path, req.user.id);

            logger.info(`Video uploaded and moved to GCS for game ${gameId}: ${gcsUri}`);
            res.status(200).json({ message: "Upload successful. Analysis started.", game });
        } catch (error) {
            logger.error(`Error during video upload for game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.get("/:gameId", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;

        try {
            const game = await gameService.getGameDetails(gameId, req.user.id);

            if (!game) {
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            res.status(200).json(game);
        } catch (error) {
            logger.error(`Error retrieving game ${gameId} details:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.get("/:gameId/identified-entities", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;

        try {
            const game = await gameRepository.findOne({ where: { id: gameId, userId: req.user.id } });
            if (!game) {
                return res.status(404).json({ message: "Game not found or does not belong to user." });
            }

            const entities = await gameAnalysisService.getIdentifiedEntities(gameId);
            res.status(200).json(entities);
        } catch (error) {
            logger.error(`Error retrieving identified entities for game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.post("/:gameId/assignment", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;
        const { tempId, realId, type } = req.body;

        try {
            await gameAssignmentService.assignEntity(gameId, tempId, realId, type, req.user.id);
            res.status(200).json({ message: "Assignment successful and stats recalculated." });
        } catch (error) {
            logger.error(`Error during entity assignment for game ${gameId}:`, error);
            res.status(500).json({ message: (error as Error).message });
        }
    });

    router.put("/game-events/:gameEventId/assign-player", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameEventId } = req.params;
        const { playerId } = req.body;

        try {
            const gameEvent = await gameEventRepository.findOneById(gameEventId);

            if (!gameEvent) {
                return res.status(404).json({ message: "Game event not found." });
            }

            // Check ownership of the game
            const game = await gameRepository.findOneBy({ id: gameEvent.gameId, userId: req.user.id });
            if (!game) return res.status(403).json({ message: "Access denied." });

            gameEvent.assignedPlayerId = playerId;
            await gameEventRepository.save(gameEvent);

            await gameStatsService.calculateAndStoreStats(gameEvent.gameId);

            res.status(200).json(gameEvent);
        } catch (error) {
            logger.error(`Error assigning player to game event ${gameEventId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.delete("/:gameId", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Unauthorized");
        }

        const { gameId } = req.params;

        try {
            await gameService.deleteGame(gameId, req.user.id);
            res.status(204).send(); 
        } catch (error) {
            logger.error(`Error deleting game ${gameId}:`, error);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    return router;
};
