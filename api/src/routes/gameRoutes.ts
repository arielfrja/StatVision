import { Router } from 'express';
import { DataSource } from 'typeorm';
import { 
    GameEventRepository, GameStatsService, GameStatus, GameEvent, Game, User 
} from '@statvision/common';
import { GameService } from '../modules/games/GameService';
import { GameAssignmentService } from '../modules/games/GameAssignmentService';
import { GameAnalysisService } from '../modules/games/GameAnalysisService';
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
    eventBus: IEventBus
) => {
    const gameRepository = AppDataSource.getRepository(Game);
    const userRepository = AppDataSource.getRepository(User);

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

        const { name, gameDate, location, season, homeTeamId, awayTeamId, visualContext, gameType, identityMode, ruleset } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Missing game name in body." });
        }

        try {
            const user = await userRepository.findOneBy({ id: req.user.id });
            if (!user) return res.status(404).json({ message: "User not found" });

            const newGame = await gameService.createGame({
                homeTeamId,
                awayTeamId,
                gameDate,
                gameType,
                identityMode,
                visualContext
            }, user);
            res.status(201).json(newGame);
        } catch (error) {
            logger.error("Error creating new game:", error);
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
