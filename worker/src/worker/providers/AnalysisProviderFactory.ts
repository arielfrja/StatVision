import { GoogleGenAI } from "@google/genai";
import { IVideoAnalysisProvider } from "../../core/interfaces/IVideoAnalysisProvider";
import { GeminiInteractionsProvider } from "./GeminiInteractionsProvider";
import { GeminiAnalysisService } from "../GeminiAnalysisService";
import { workerConfig } from "../../config/workerConfig";

/**
 * Factory for creating video analysis providers.
 * Allows switching between different Gemini versions or other AI providers
 * via environment variables.
 */
export class AnalysisProviderFactory {
    /**
     * Creates a provider based on the current configuration.
     * Defaults to the new Gemini Interactions API if not specified.
     */
    public static createProvider(apiKey: string): IVideoAnalysisProvider {
        const genAI = new GoogleGenAI({ apiKey });
        
        // We can add a PROVIDER_TYPE env var to workerConfig later.
        // For now, we will default to the new Interactions provider if the model is 3.x, 2.5+, or contains 'interactions'
        const modelName = workerConfig.geminiModelName.toLowerCase();
        const isModernModel = modelName.includes('3.1') || 
                             modelName.includes('3-') || 
                             modelName.includes('2.5') ||
                             modelName.includes('interactions');

        if (isModernModel) {
            return new GeminiInteractionsProvider(genAI);
        }

        // Fallback to the legacy service (wrapped as a provider)
        // Note: In a full refactor, GeminiAnalysisService would also implement IVideoAnalysisProvider
        return new GeminiAnalysisService(genAI) as unknown as IVideoAnalysisProvider;
    }
}
