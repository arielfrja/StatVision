import { GameStatus, Game } from "../Game";
import { IGameRepository } from "../repository/IGameRepository";
import logger from "../config/logger";
import { In, Repository } from "typeorm";
import { User } from "../User";
import * as fs from 'fs'; // New import
import { GameEventRepository } from "../repository/GameEventRepository";
import { TeamRepository } from "../repository/TeamRepository";
import { PlayerRepository } from "../repository/PlayerRepository";
import { Team } from "../Team";
import { Player } from "../Player";
import { GamePlayerStatsRepository } from "../repository/GamePlayerStatsRepository";

interface GameCreationData {
    name: string;
    gameDate?: Date | null;
    location?: string | null;
    opponentName?: string | null;
    quarterDuration?: number | null;
    season?: string | null;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
}

export class GameService {
    private gameRepository: IGameRepository;
    private userRepository: Repository<User>;
    private gameEventRepository: GameEventRepository;
    private teamRepository: TeamRepository;
    private playerRepository: PlayerRepository;
    private playerStatsRepository: GamePlayerStatsRepository;

    constructor(
        gameRepository: IGameRepository, 
        userRepository: Repository<User>,
        gameEventRepository: GameEventRepository,
        teamRepository: TeamRepository,
        playerRepository: PlayerRepository,
        playerStatsRepository: GamePlayerStatsRepository
    ) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.gameEventRepository = gameEventRepository;
        this.teamRepository = teamRepository;
        this.playerRepository = playerRepository;
        this.playerStatsRepository = playerStatsRepository;
    }

    /**
     * Creates a new Game record with a default status and new metadata.
     * @param auth0Uid The Auth0 UID from the JWT.
     * @param data The game creation data including new metadata fields.
     * @returns A promise that resolves to the newly created Game entity.
     */
    async createGame(auth0Uid: string, data: GameCreationData): Promise<Game> {
        const user = await this.userRepository.findOne({ where: { providerUid: auth0Uid } });

        if (!user) {
            logger.error(`GameService: Cannot create game, user not found for Auth0 UID: ${auth0Uid}`);
            throw new Error("User not found in local database.");
        }

        const newGame = new Game();
        newGame.userId = user.id;
        newGame.name = data.name;
        newGame.status = GameStatus.UPLOADED; // Initial status before file upload is confirmed
        
        // New Metadata Fields
        newGame.gameDate = data.gameDate || null;
        newGame.location = data.location || null;
        newGame.opponentName = data.opponentName || null;
        newGame.quarterDuration = data.quarterDuration || null;
        newGame.season = data.season || null;
        newGame.homeTeamId = data.homeTeamId || null;
        newGame.awayTeamId = data.awayTeamId || null;

        return this.gameRepository.create(newGame);
    }

    /**
     * Implements BE-305: Updates the status of a game record.
     * @param gameId The ID of the game to update.
     * @param newStatus The new status to set.
     */
    async updateGameStatus(gameId: string, newStatus: GameStatus): Promise<void> {
        logger.info(`GameService: Attempting to update game ${gameId} status to ${newStatus}.`);
        await this.gameRepository.updateStatus(gameId, newStatus);
        logger.info(`GameService: Status update successful for game ${gameId}.`);
    }

    /**
     * Implements BE-305: Updates the file path and status of a game record.
     * @param gameId The ID of the game to update.
     * @param filePath The local file path of the uploaded video.
     * @param newStatus The new status to set (should be UPLOADED).
     */
    async updateGameFilePathAndStatus(gameId: string, filePath: string, newStatus: GameStatus): Promise<void> {
        logger.info(`GameService: Attempting to update game ${gameId} file path and status to ${newStatus}.`);
        await this.gameRepository.updateFilePathAndStatus(gameId, filePath, newStatus);
        logger.info(`GameService: File path and status update successful for game ${gameId}.`);
    }

    /**
     * Implements BE-500: Retrieves all games for the authenticated user.
     * @param auth0Uid The Auth0 UID from the JWT.
     * @returns A promise that resolves to an array of Game entities.
     */
    async getGamesForUser(auth0Uid: string): Promise<Game[]> {
        const user = await this.userRepository.findOne({ where: { providerUid: auth0Uid } });

        if (!user) {
            logger.warn(`GameService: User not found for Auth0 UID: ${auth0Uid}`);
            return [];
        }

        return this.gameRepository.findAllByUserId(user.id);
    }

    /**
     * Implements BE-501: Retrieves a single game with all related details.
     * @param auth0Uid The Auth0 UID from the JWT.
     * @param gameId The ID of the game to retrieve.
     * @returns A promise that resolves to the Game entity with details, or null.
     */
    async getGameDetails(auth0Uid: string, gameId: string): Promise<Game | null> {
        const user = await this.userRepository.findOne({ where: { providerUid: auth0Uid } });

        if (!user) {
            logger.warn(`GameService: User not found for Auth0 UID: ${auth0Uid}`);
            return null;
        }

        return this.gameRepository.findOneWithDetails(gameId, user.id);
    }

    /**
     * Deletes a game and all its associated data.
     * @param gameId The ID of the game to delete.
     * @param userId The ID of the user who owns the game.
     */
    async deleteGame(gameId: string, userId: string): Promise<void> {
        logger.info(`GameService: Deleting game ${gameId} for user ${userId}.`);

        // 1. Find the game to get its file path
        const game = await this.gameRepository.findOneByIdAndUserId(gameId, userId);
        if (!game) {
            logger.warn(`GameService: Attempted to delete non-existent game ${gameId} for user ${userId}.`);
            throw new Error("Game not found or does not belong to user.");
        }

        // 2. Delete associated video file if it exists
        if (game.filePath) {
            try {
                await fs.promises.unlink(game.filePath);
                logger.info(`GameService: Successfully deleted video file: ${game.filePath}`);
            } catch (error) {
                logger.error(`GameService: Failed to delete video file ${game.filePath} for game ${gameId}:`, error);
                // Continue with database deletion even if file deletion fails
            }
        }

        // 3. Delete the game and all its cascade-deleted relations (events, stats)
        await this.gameRepository.delete(gameId, userId);
        logger.info(`GameService: Successfully deleted game ${gameId} and its associated database records.`);
    }

    async getIdentifiedEntities(gameId: string): Promise<any[]> {
        logger.info(`GameService: Fetching identified entities for game ${gameId}.`);

        // 1. Get all unique team IDs from the game's events
        const { teamIds } = await this.gameEventRepository.findUniqueEntityIdsByGameId(gameId);
        if (teamIds.length === 0) {
            return [];
        }

        // 2. Fetch the full team objects
        const teams = await this.teamRepository.findByIds(teamIds);

        // 3. Fetch all player stats for the game to get jersey numbers and descriptions
        const playerStatsForGame = await this.playerStatsRepository.findByGameId(gameId);
        const statsMap = new Map(playerStatsForGame.map(ps => [ps.playerId, { jerseyNumber: ps.jerseyNumber, description: ps.description }]));

        // 4. For each team, find the unique players and enrich them with stats info
        const teamsWithPlayers = await Promise.all(teams.map(async (team) => {
            const playerIds = await this.gameEventRepository.findUniquePlayerIdsByGameAndTeam(gameId, team.id);
            const players = playerIds.length > 0 ? await this.playerRepository.findByIds(playerIds) : [];
            
            const enrichedPlayers = players.map(player => {
                const stats = statsMap.get(player.id);
                return {
                    ...player,
                    jerseyNumber: stats?.jerseyNumber ?? null,
                    description: stats?.description ?? null,
                };
            });

            return { ...team, players: enrichedPlayers };
        }));

        logger.info(`GameService: Found ${teamsWithPlayers.length} unique teams with their identified players for game ${gameId}.`);

        return teamsWithPlayers;
    }
}
