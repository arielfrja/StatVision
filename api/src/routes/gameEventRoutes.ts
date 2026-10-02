import { Router } from 'express';
import { DataSource } from 'typeorm';
import {
    GameEventRepository, GameStatsService, GameRepository,
    ALLOWED_EVENT_TYPES, flagImpossibleSequences,
    ClipService, IStorageProvider,
} from '@statvision/common';
import logger from '../config/logger';

/**
 * Top-level game-event routes (mounted at /game-events, behind auth).
 * These are the endpoints the EventEditor actually calls — an earlier
 * revision only mounted assign-player nested under /games (unreachable),
 * leaving Save/Delete/Assign as dead buttons (404s).
 */
export const gameEventRoutes = (
    AppDataSource: DataSource,
    gameEventRepository: GameEventRepository,
    gameStatsService: GameStatsService,
    gameRepository: GameRepository,
    storageProvider: IStorageProvider,
) => {
    const router = Router();

    const loadOwnedEvent = async (gameEventId: string, userId: string) => {
        const gameEvent = await gameEventRepository.findOneById(gameEventId);
        if (!gameEvent) return { error: 404 as const, gameEvent: null, game: null };
        const game = await gameRepository.findOneByIdAndUserId(gameEvent.gameId, userId);
        if (!game) return { error: 404 as const, gameEvent: null, game: null };
        return { error: null, gameEvent, game };
    };

    const recomputeReviewFlags = async (gameId: string) => {
        // Re-run ordering validation across the game after a manual edit.
        // System-set flags only (human `verified` precision is untouched).
        const events = await gameEventRepository.findByGameId(gameId);
        const before = new Map(events.map((e) => [e.id, !!(e as any).needsReview]));
        for (const e of events) (e as any).needsReview = false;
        const flagged = flagImpossibleSequences(events as any[]);
        const changed = events.filter((e) => !!(e as any).needsReview !== before.get(e.id));
        if (changed.length > 0) {
            await gameEventRepository.batchInsert(changed as any);
        }
        return flagged;
    };

    router.put("/:gameEventId", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { gameEventId } = req.params;
        const { eventType, eventSubType, assignedTeamId, assignedPlayerId, timePrecision, isSuccessful } = req.body;

        if (eventType !== undefined && !(ALLOWED_EVENT_TYPES as readonly string[]).includes(eventType)) {
            return res.status(400).json({ message: "Unknown eventType." });
        }
        if (timePrecision !== undefined && timePrecision !== 'estimated' && timePrecision !== 'verified') {
            return res.status(400).json({ message: "timePrecision must be 'estimated' or 'verified'." });
        }

        try {
            const { error, gameEvent } = await loadOwnedEvent(gameEventId, req.user.id);
            if (error || !gameEvent) {
                return res.status(404).json({ message: "Game event not found." });
            }

            if (eventType !== undefined) gameEvent.eventType = eventType;
            if (eventSubType !== undefined) gameEvent.eventSubType = eventSubType;
            if (assignedTeamId !== undefined) gameEvent.assignedTeamId = assignedTeamId;
            if (assignedPlayerId !== undefined) gameEvent.assignedPlayerId = assignedPlayerId;
            if (timePrecision !== undefined) (gameEvent as any).timePrecision = timePrecision;
            if (isSuccessful !== undefined) gameEvent.isSuccessful = !!isSuccessful;
            await gameEventRepository.save(gameEvent);

            await recomputeReviewFlags(gameEvent.gameId);
            await gameStatsService.calculateAndStoreStats(gameEvent.gameId);

            res.status(200).json(gameEvent);
        } catch (err: any) {
            logger.error(`Error updating game event ${gameEventId}:`, err);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.delete("/:gameEventId", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { gameEventId } = req.params;

        try {
            const { error, gameEvent } = await loadOwnedEvent(gameEventId, req.user.id);
            if (error || !gameEvent) {
                return res.status(404).json({ message: "Game event not found." });
            }

            const gameId = gameEvent.gameId;
            await gameEventRepository.delete(gameEventId);

            await gameStatsService.calculateAndStoreStats(gameId);

            res.status(200).json({ message: "Event deleted." });
        } catch (err: any) {
            logger.error(`Error deleting game event ${gameEventId}:`, err);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    router.put("/:gameEventId/assign-player", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { gameEventId } = req.params;
        const { playerId } = req.body;

        try {
            const { error, gameEvent } = await loadOwnedEvent(gameEventId, req.user.id);
            if (error || !gameEvent) {
                return res.status(404).json({ message: "Game event not found." });
            }

            gameEvent.assignedPlayerId = playerId;
            await gameEventRepository.save(gameEvent);

            await gameStatsService.calculateAndStoreStats(gameEvent.gameId);

            res.status(200).json(gameEvent);
        } catch (err: any) {
            logger.error(`Error assigning player to game event ${gameEventId}:`, err);
            res.status(500).json({ message: "Internal server error." });
        }
    });

    // Per-event video clip export (infra-ready, disabled by default).
    // Enablement requires source-video retention (currently deleted on
    // finalize) + CLIPS_ENABLED=true. Until then: honest 501, no storage.
    router.get("/:gameEventId/clip", async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!ClipService.isEnabled()) {
            return res.status(501).json({
                code: "CLIPS_DISABLED",
                message: "Clip export is not enabled. Source footage is not retained.",
            });
        }

        const { gameEventId } = req.params;
        const padStart = req.query.padStart !== undefined ? Number(req.query.padStart) : undefined;
        const padEnd = req.query.padEnd !== undefined ? Number(req.query.padEnd) : undefined;

        try {
            const { error, gameEvent, game } = await loadOwnedEvent(gameEventId, req.user.id);
            if (error || !gameEvent || !game) {
                return res.status(404).json({ message: "Game event not found." });
            }
            if (typeof gameEvent.absoluteTimestamp !== 'number') {
                return res.status(400).json({ message: "Event has no timestamp to clip around." });
            }
            if (!game.filePath) {
                return res.status(404).json({ message: "Source video is no longer retained for this game." });
            }

            const clips = new ClipService(storageProvider);
            (gameEvent as any).clipStatus = 'pending';
            await gameEventRepository.save(gameEvent);
            const out = await clips.exportClip({
                sourceVideo: game.filePath,
                timestamp: gameEvent.absoluteTimestamp,
                padStart,
                padEnd,
                destPrefix: `clips/${gameEvent.gameId}`,
                clipName: gameEventId,
            });
            (gameEvent as any).clipStatus = 'ready';
            (gameEvent as any).clipUrl = out.gcsUri;
            (gameEvent as any).clipError = null;
            await gameEventRepository.save(gameEvent);

            res.status(200).json(out);
        } catch (err: any) {
            logger.error(`Error exporting clip for event ${gameEventId}:`, err);
            try {
                const existing = await gameEventRepository.findOneById(gameEventId);
                if (existing) {
                    (existing as any).clipStatus = 'failed';
                    (existing as any).clipError = String(err?.message || err).slice(0, 200);
                    await gameEventRepository.save(existing);
                }
            } catch {
                /* best-effort */
            }
            res.status(500).json({ message: "Clip export failed." });
        }
    });

    return router;
};
