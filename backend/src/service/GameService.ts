import { GameStatus, Game } from "../Game";
import { IGameRepository } from "../repository/IGameRepository";
import logger from "../config/logger";
import { Repository } from "typeorm";
import { User } from "../User";

export class GameService {
    private gameRepository: IGameRepository;
    private userRepository: Repository<User>;

    constructor(
        gameRepository: IGameRepository, 
        userRepository: Repository<User>
    ) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
    }

    /**
     * Implements BE-305: Updates the status of a game record.
     * @param gameId The ID of the game to update.
     * @param newStatus The new status to set.
     */
    async updateGameStatus(gameId: string, newStatus: GameStatus): Promise<void> {
        logger.info(`GameService: Attempting to update game ${gameId} status to ${newStatus}.`);
        
        // In a more complex scenario, we would add logic here to check for valid status transitions.
        // For MVP, we rely on the repository to handle the update.
        
        await this.gameRepository.updateStatus(gameId, newStatus);
        
        logger.info(`GameService: Status update successful for game ${gameId}.`);
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
}