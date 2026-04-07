import { VideoChunk } from "../../worker/VideoChunkerService";
import { IdentifiedPlayer, IdentifiedTeam } from "./video-analysis.interfaces";
import { GameType, IdentityMode } from "../entities/Game";

/**
 * Result of an analysis attempt.
 */
export interface AnalysisProviderResponse {
    status: 'fulfilled' | 'rejected';
    events: any[];
    rawResponse: string;
    error?: any;
    updatedHistory?: any[];
}

/**
 * Generic interface for AI video analysis providers.
 * This allows swapping between different Gemini versions,
 * or even other providers like OpenAI or AWS, without
 * changing the core worker logic.
 */
export interface IVideoAnalysisProvider {
    /**
     * Unique name of the provider (e.g., 'gemini-interactions-v3')
     */
    readonly name: string;

    /**
     * Analyzes a video chunk and extracts sports events.
     */
    analyzeChunk(
        chunk: VideoChunk,
        knownPlayers: IdentifiedPlayer[],
        knownTeams: IdentifiedTeam[],
        visualContext?: string,
        gameType?: GameType,
        identityMode?: IdentityMode,
        chatHistory?: any[]
    ): Promise<AnalysisProviderResponse>;
}
