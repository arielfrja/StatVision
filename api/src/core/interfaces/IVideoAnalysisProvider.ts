import { GameType, IdentityMode } from "@statvision/common";

export interface IVideoAnalysisProvider {
    analyzeVideo(videoPath: string, options: any): Promise<any>;
}
