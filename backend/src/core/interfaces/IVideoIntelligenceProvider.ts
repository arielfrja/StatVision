import { IdentifiedPlayer, IdentifiedTeam } from "./video-analysis.interfaces";
import { GameType, IdentityMode } from "../entities/Game";

export interface VideoChunkInfo {
    chunkPath: string;
    startTime: number;
    sequence: number;
}

export interface AnalysisResult {
    events: any[];
    rawResponse: string;
    updatedHistory?: any[];
}

export interface IVideoIntelligenceProvider {
    analyzeVideoChunk(
        chunk: VideoChunkInfo,
        knownPlayers: IdentifiedPlayer[],
        knownTeams: IdentifiedTeam[],
        visualContext?: string,
        gameType?: GameType,
        identityMode?: IdentityMode,
        chatHistory?: any[]
    ): Promise<AnalysisResult>;
}
