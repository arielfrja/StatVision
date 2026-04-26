import { VideoChunk } from "../../worker/VideoChunkerService";
import { IdentifiedPlayer, IdentifiedTeam } from "./video-analysis.interfaces";
import { GameType, IdentityMode } from "@statvision/common";

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
 */
export interface IVideoAnalysisProvider {
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
