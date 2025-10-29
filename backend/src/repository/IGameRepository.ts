import { Game, GameStatus } from "../Game";

export interface IGameRepository {
    // Method to find a game by ID and user ID (for ownership check)
    findOneByIdAndUserId(gameId: string, userId: string): Promise<Game | null>;

    // Method to find a game with all related details (events, teams, players)
    findOneWithDetails(gameId: string, userId: string): Promise<Game | null>;

    // Method to find all games for a given user ID
    findAllByUserId(userId: string): Promise<Game[]>;

    // Method to update the status of a game
    updateStatus(gameId: string, status: GameStatus): Promise<void>;
}