import { Game, GameStatus } from "../entities";

export interface IGameRepository {
    create(game: Game): Promise<Game>;
    findOneById(gameId: string): Promise<Game | null>;
    findOneByIdAndUserId(gameId: string, userId: string): Promise<Game | null>;
    updateStatus(gameId: string, status: GameStatus, failedChunkInfo?: { chunkPath: string; startTime: number; sequence: number; }[] | null): Promise<void>;
    updateFilePathAndStatus(gameId: string, filePath: string, status: GameStatus): Promise<void>;
    findAllByUserId(userId: string): Promise<Game[]>;
    findOneWithDetails(gameId: string, userId: string): Promise<Game | null>;
    findOneWithDetailsInternal(gameId: string): Promise<Game | null>;
    save(game: Game): Promise<Game>;
    delete(gameId: string, userId: string): Promise<void>;
}
