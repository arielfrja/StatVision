import { ProgressManager } from './ProgressManager';
import { Message } from '@google-cloud/pubsub';
import { DataSource } from 'typeorm';
import { chunkLogger } from '../config/loggers';
import { VideoAnalysisJobRepository } from './VideoAnalysisJobRepository';
import { ChunkRepository } from './ChunkRepository';
import { AnalysisProviderFactory } from './providers/AnalysisProviderFactory';
import { EventProcessorService } from './EventProcessorService';
import { JobFinalizerService } from './JobFinalizerService';
import { workerConfig } from '../config/workerConfig';
import { 
    Chunk, ChunkStatus, VideoAnalysisJobStatus, 
    IdentifiedPlayer, IdentifiedTeam, 
    IEventBus, IVideoAnalysisProvider 
} from '@statvision/common';

const CHUNK_ANALYSIS_SUBSCRIPTION_NAME = process.env.CHUNK_ANALYSIS_SUBSCRIPTION_NAME || 'chunk-analysis-sub';

interface ChunkMessage {
    jobId: string;
    chunkId: string;
}

export class ChunkProcessorWorker {
    private jobRepository: VideoAnalysisJobRepository;
    private chunkRepository: ChunkRepository;
    private analysisProvider: IVideoAnalysisProvider;
    private eventProcessorService: EventProcessorService;
    private jobFinalizerService: JobFinalizerService;
    private logger = chunkLogger;
    private processingMode: string;

    constructor(private dataSource: DataSource, private eventBus: IEventBus) {
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.chunkRepository = new ChunkRepository(dataSource);
        this.eventProcessorService = new EventProcessorService();
        this.jobFinalizerService = new JobFinalizerService(dataSource, eventBus);
        this.processingMode = workerConfig.processingMode;

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable not set!");
        }
        this.analysisProvider = AnalysisProviderFactory.createProvider(GEMINI_API_KEY);
    }

    public async startConsumingMessages(): Promise<void> {
        this.logger.info('ChunkProcessorWorker: Starting to consume messages from Pub/Sub...', { phase: 'analyzing' });
        
        await this.eventBus.subscribe(CHUNK_ANALYSIS_SUBSCRIPTION_NAME, async (parsedMessage: ChunkMessage, message: Message) => {
            this.logger.info(`Received analysis request for chunk ${parsedMessage.chunkId} of job ${parsedMessage.jobId}`, { phase: 'analyzing' });
            
            let heartbeat: NodeJS.Timeout | null = null;
            const extendAckDeadline = async () => {
                this.logger.debug(`Extending ack deadline for message ${message.id}`, { phase: 'analyzing' });
                message.modAck(workerConfig.ackDeadlineSeconds);
            };

            try {
                heartbeat = setInterval(extendAckDeadline, workerConfig.heartbeatIntervalSeconds * 1000);

                await this.processChunk(parsedMessage);
                
                if (heartbeat) clearInterval(heartbeat);
                message.ack();
            } catch (error: any) {
                if (heartbeat) clearInterval(heartbeat);
                this.logger.error(`Error processing chunk:`, { error, phase: 'analyzing' });
                message.nack();
            }
        }, {
            flowControl: {
                maxMessages: 1, 
            },
        });
    }

    private async processChunk(message: ChunkMessage): Promise<void> {
        const { jobId, chunkId } = message;

        const job = await this.jobRepository.findOneById(jobId);
        if (!job) {
            this.logger.error(`Job ${jobId} not found for chunk ${chunkId}`, { phase: 'analyzing' });
            return;
        }

        const chunk = await this.chunkRepository.findOneById(chunkId);
        if (!chunk) {
            this.logger.error(`Chunk ${chunkId} not found.`, { phase: 'analyzing' });
            return;
        }

        if (chunk.status === ChunkStatus.COMPLETED) {
            this.logger.info(`Chunk ${chunkId} is already COMPLETED. Skipping.`, { phase: 'analyzing' });
            return;
        }

        this.logger.info(`[CHUNK_PROCESSOR] Analyzing chunk ${chunk.sequence} for Job ${jobId}`, { phase: 'analyzing' });
        chunk.status = ChunkStatus.ANALYZING;
        await this.chunkRepository.update(chunk);

        try {
            const gameRepository = this.dataSource.getRepository('games') as any;
            const game = await gameRepository.findOne({ where: { id: job.gameId } });
            
            if (!game) throw new Error("Game not found for job.");

            // Prepare visual context and entities
            const visualContextString = game.visualContext ? JSON.stringify(game.visualContext) : '';
            const identifiedPlayers: IdentifiedPlayer[] = job.identifiedPlayers || [];
            const identifiedTeams: IdentifiedTeam[] = job.identifiedTeams || [];

            // Get chat history from previous chunks if in sequential mode
            let chatHistory: any[] = [];
            if (this.processingMode === 'sequential' && chunk.sequence > 0) {
                const previousChunks = await this.chunkRepository.find({
                    where: { jobId, status: ChunkStatus.COMPLETED },
                    order: { sequence: 'ASC' }
                });
                
                // Reconstruct history from successful chunks
                for (const prev of previousChunks) {
                    if (prev.rawGeminiResponse) {
                        chatHistory.push({
                            role: "user",
                            parts: [{ text: `Process chunk ${prev.sequence}` }]
                        });
                        chatHistory.push({
                            role: "model",
                            parts: [{ text: prev.rawGeminiResponse }]
                        });
                    }
                }
            }

            const analysisResult = await this.analysisProvider.analyzeVideoChunk(
                {
                    chunkPath: chunk.chunkPath,
                    startTime: chunk.startTime,
                    sequence: chunk.sequence
                },
                identifiedPlayers,
                identifiedTeams,
                visualContextString,
                game.gameType,
                game.identityMode,
                chatHistory
            );

            const { finalEvents, updatedIdentifiedPlayers, updatedIdentifiedTeams } = this.eventProcessorService.processEvents(
                analysisResult.events,
                job.gameId,
                { startTime: chunk.startTime, sequence: chunk.sequence },
                workerConfig.chunkDurationSeconds,
                workerConfig.chunkOverlapSeconds,
                new Set(), 
                identifiedPlayers,
                identifiedTeams,
                game.gameType,
                game.identityMode
            );

            chunk.status = ChunkStatus.COMPLETED;
            chunk.processedEvents = finalEvents;
            chunk.identifiedPlayers = updatedIdentifiedPlayers;
            chunk.identifiedTeams = updatedIdentifiedTeams;
            chunk.rawGeminiResponse = analysisResult.rawResponse;
            await this.chunkRepository.update(chunk);

            // Update Job with potentially new identified entities
            await this.jobRepository.update(jobId, {
                identifiedPlayers: updatedIdentifiedPlayers,
                identifiedTeams: updatedIdentifiedTeams
            });

            const progressManager = ProgressManager.getInstance();
            progressManager.updateJob(jobId, 1, `Chunk ${chunk.sequence + 1} analyzed.`);

            // Publish live result
            const resultMessage = {
                jobId,
                gameId: job.gameId,
                userId: job.userId,
                chunkId,
                status: VideoAnalysisJobStatus.PROCESSING,
                processedEvents: finalEvents,
                identifiedPlayers: updatedIdentifiedPlayers,
                identifiedTeams: updatedIdentifiedTeams,
                isFinalResult: false
            };
            await this.eventBus.publish(workerConfig.chunkAnalysisResultsTopicName, resultMessage);

            // Trigger finalizer check
            await this.jobFinalizerService.finalizeJob(jobId);

        } catch (error: any) {
            this.logger.error(`Failed to process chunk ${chunk.sequence}: ${error.message}`, { error, phase: 'analyzing' });
            chunk.status = ChunkStatus.FAILED;
            chunk.failureReason = error.message;
            await this.chunkRepository.update(chunk);
            
            await this.jobFinalizerService.finalizeJob(jobId);
            throw error;
        }
    }
}
