import { GeminiProvider, ILogger, IVideoAnalysisProvider } from "@statvision/common";
import { workerConfig } from "../../config/workerConfig";
import { chunkLogger } from "../../config/loggers";

/**
 * Factory for creating video analysis providers.
 * Uses the consolidated GeminiProvider from @statvision/common.
 */
export class AnalysisProviderFactory {
    public static createProvider(apiKey: string): IVideoAnalysisProvider {
        const modelName = workerConfig.geminiModelName;
        const logger = chunkLogger as unknown as ILogger;
        
        // The GeminiProvider from @statvision/common implements IVideoIntelligenceProvider,
        // which we've also aliased to IVideoAnalysisProvider in common for compatibility.
        return new GeminiProvider(apiKey, modelName, logger) as unknown as IVideoAnalysisProvider;
    }
}
