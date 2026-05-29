import { IdentifiedPlayer, IdentifiedTeam } from "./video-analysis.interfaces";
import { GameType, IdentityMode } from "../entities/Game";

export interface VideoChunkInfo {
    chunkPath: string;
    startTime: number;
    endTime: number;
    sequence: number;
    fileUri?: string;
    fileName?: string;
}

export interface UsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
}

export interface AnalysisResult {
    events: any[];
    rawResponse: string;
    usageMetadata?: UsageMetadata;
    updatedHistory?: any[];
    status?: 'fulfilled' | 'rejected';
    error?: any;
    fileUri?: string;
    fileName?: string;
}

export interface AnalysisProviderResponse extends AnalysisResult {}

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

    deleteFile(fileName: string): Promise<void>;
}

export interface IVideoAnalysisProvider extends IVideoIntelligenceProvider {
    analyzeChunk(
        chunk: VideoChunkInfo,
        knownPlayers: IdentifiedPlayer[],
        knownTeams: IdentifiedTeam[],
        visualContext?: string,
        gameType?: GameType,
        identityMode?: IdentityMode,
        chatHistory?: any[]
    ): Promise<AnalysisResult>;
}
