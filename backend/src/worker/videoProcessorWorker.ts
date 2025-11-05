import { DataSource } from "typeorm";
import { PubSub, Message } from "@google-cloud/pubsub";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import logger from "../config/logger";
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import * as cliProgress from 'cli-progress';

import { VideoAnalysisJob, VideoAnalysisJobStatus } from "./VideoAnalysisJob";
import { VideoAnalysisJobRepository } from "./VideoAnalysisJobRepository";
import { VideoChunkerService, VideoChunk } from "../service/VideoChunkerService";
import { GeminiAnalysisService, GeminiApiResponse } from "../service/GeminiAnalysisService";

interface PubSubMessage {
    gameId: string;
    filePath: string;
    userId: string;
}

const VIDEO_UPLOAD_TOPIC_NAME = process.env.VIDEO_UPLOAD_TOPIC_NAME || 'video-uploads';
const VIDEO_UPLOAD_SUBSCRIPTION_NAME = process.env.VIDEO_UPLOAD_SUBSCRIPTION_NAME || 'video-uploads-subscription';
const VIDEO_ANALYSIS_RESULTS_TOPIC_NAME = process.env.VIDEO_ANALYSIS_RESULTS_TOPIC_NAME || 'video-analysis-results';

const ALLOWED_EVENT_TYPES = [
    'Game Start', 'Period Start', 'Jump Ball', 'Jump Ball Possession', 'Possession Change',
    'Shot Attempt', 'Shot Made', 'Shot Missed', '3PT Shot Attempt', '3PT Shot Made', '3PT Shot Missed',
    'Free Throw Attempt', 'Free Throw Made', 'Free Throw Missed',
    'Offensive Rebound', 'Defensive Rebound', 'Team Rebound',
    'Assist', 'Steal', 'Block', 'Turnover',
    'Personal Foul', 'Shooting Foul', 'Offensive Foul', 'Technical Foul', 'Flagrant Foul',
    'Violation', 'Out of Bounds', 'Substitution', 'Timeout Taken',
    'End of Period', 'End of Game'
];

import * as winston from 'winston'; // Import winston for typing the logger

export class VideoProcessorWorker {
    private jobRepository: VideoAnalysisJobRepository;
    private pubSubClient: PubSub;
    private genAI: GoogleGenerativeAI;
    private logger: winston.Logger; // Add a private logger property
    private videoChunkerService: VideoChunkerService; // Add this line
    private geminiAnalysisService: GeminiAnalysisService; // Add this line

    constructor(dataSource: DataSource, logger: winston.Logger) { // Accept logger in constructor
        this.jobRepository = new VideoAnalysisJobRepository(dataSource);
        this.pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
        this.logger = logger; // Assign the passed logger
        this.videoChunkerService = new VideoChunkerService(); // Add this line

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable not set!");
        }
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.geminiAnalysisService = new GeminiAnalysisService(this.genAI); // Add this line
    }

    public async startConsumingMessages(): Promise<void> {
        this.logger.info("VideoProcessorWorker: Starting to consume messages from Pub/Sub...");
        const subscription = this.pubSubClient.topic(VIDEO_UPLOAD_TOPIC_NAME).subscription(VIDEO_UPLOAD_SUBSCRIPTION_NAME);

        subscription.on('message', async (message: Message) => {
            this.logger.info(`Received message ${message.id}:`);
            this.logger.info(`\tData: ${message.data}`);

            let job: VideoAnalysisJob | null = null;
            try {
                const parsedMessage: PubSubMessage = JSON.parse(message.data.toString());

                // Attempt to find an existing RETRYABLE_FAILED job for this gameId and filePath
                job = await this.jobRepository.findOneByGameIdAndFilePath(parsedMessage.gameId, parsedMessage.filePath);

                if (job && job.status === VideoAnalysisJobStatus.RETRYABLE_FAILED) {
                    logger.info(`Found existing RETRYABLE_FAILED job ${job.id} for game ${job.gameId}. Re-processing failed chunks.`);
                    job.status = VideoAnalysisJobStatus.PROCESSING; // Mark as processing for retry
                    await this.jobRepository.update(job);
                } else {
                    // Create a new job if no retryable job found or if it's a fresh request
                    job = new VideoAnalysisJob();
                    job.gameId = parsedMessage.gameId;
                    job.userId = parsedMessage.userId;
                    job.filePath = parsedMessage.filePath;
                    job.status = VideoAnalysisJobStatus.PENDING;
                    await this.jobRepository.create(job);
                    logger.info(`Created new job ${job.id} for game ${job.gameId}.`);
                }

                await this.processJob(job);
                message.ack();
            } catch (error) {
                logger.error(`Error processing Pub/Sub message ${message.id}:`, error);
                if (job) {
                    job.status = VideoAnalysisJobStatus.FAILED; // Mark job as FAILED if an unhandled error occurs
                    await this.jobRepository.update(job);
                }
                message.nack(); // Nack the message to indicate failure and potentially retry
            }
        });

        subscription.on('error', (error) => {
            logger.error("Pub/Sub subscription error:", error);
        });

        logger.info(`VideoProcessorWorker: Listening for messages on subscription: ${VIDEO_UPLOAD_SUBSCRIPTION_NAME}`);
    }

    // Renamed from processMessage to processJob to reflect new responsibility
    public async processJob(job: VideoAnalysisJob): Promise<void> {
        this.logger.info(`VideoProcessorWorker: Processing job ${job.id} for Game ID: ${job.gameId}, FilePath: ${job.filePath}`);

        let videoChunksToProcess: { chunkPath: string; startTime: number; sequence: number; }[] = [];
        const currentlyFailedChunks: any[] = [];

        let identifiedPlayers: any[] = job.identifiedPlayers || [];
        let identifiedTeams: any[] = job.identifiedTeams || [];

        const multibar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: ' {bar} | {percentage}% | {task} | {value}/{total} {unit}'
        }, cliProgress.Presets.shades_grey);

        const overallProgressBar = multibar.create(100, 0, { task: 'Overall Progress', unit: '' });
        const currentTaskProgressBar = multibar.create(100, 0, { task: 'Current Task', unit: '' });

        try {
            job.status = VideoAnalysisJobStatus.PROCESSING;
            await this.jobRepository.update(job);
            overallProgressBar.update(0, { task: 'Job status to PROCESSING', unit: '' });

            const chunkDuration = 150;
            const overlapDuration = 30;
            const tempDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            // Determine which chunks to process
            if (job.failedChunkInfo && job.failedChunkInfo.length > 0) {
                this.logger.info(`VideoProcessorWorker: Retrying ${job.failedChunkInfo.length} failed chunks for Job ID: ${job.id}.`);
                videoChunksToProcess = job.failedChunkInfo;
                currentTaskProgressBar.update(0, { task: 'Processing failed chunks', unit: 'chunks' });
            } else {
                this.logger.info(`VideoProcessorWorker: Starting fresh analysis (or full re-run) for Job ID: ${job.id}.`);
                currentTaskProgressBar.update(0, { task: 'Chunking video', unit: 'chunks' });
                videoChunksToProcess = await this.videoChunkerService.chunkVideo(job.filePath, tempDir, chunkDuration, overlapDuration, currentTaskProgressBar);
                currentTaskProgressBar.update(videoChunksToProcess.length, { task: 'Chunking video', unit: 'chunks' });
                this.logger.info(`VideoProcessorWorker: Generated ${videoChunksToProcess.length} video chunks for ${job.filePath}`);
            }
            
            overallProgressBar.setTotal(videoChunksToProcess.length);
            overallProgressBar.update(0, { task: 'Calling Gemini API', unit: 'chunks' });

            const runInParallel = process.env.GEMINI_API_PARALLEL_EXECUTION === 'true';
            this.logger.info(`VideoProcessorWorker: Gemini API calls will run ${runInParallel ? 'in parallel' : 'sequentially'}.`);

            let allGeminiResults: ({ status: 'fulfilled'; events: any[] } | { status: 'rejected'; chunkInfo: any; error: any })[];

            if (runInParallel) {
                currentTaskProgressBar.update(0, { task: 'Calling Gemini API (Parallel)', unit: 'chunks' });
                const allChunkPromises = videoChunksToProcess.map(chunkInfo => this.geminiAnalysisService.callGeminiApi(chunkInfo, identifiedPlayers, identifiedTeams));
                allGeminiResults = await Promise.all(allChunkPromises);
            } else {
                currentTaskProgressBar.update(0, { task: 'Calling Gemini API (Sequential)', unit: 'chunks' });
                allGeminiResults = [];
                for (const chunkInfo of videoChunksToProcess) {
                    const result = await this.geminiAnalysisService.callGeminiApi(chunkInfo, identifiedPlayers, identifiedTeams);
                    allGeminiResults.push(result);
                }
            }

            const allRawEvents: any[] = [];
            for (const result of allGeminiResults) { // Change to for...of loop to allow iterative updates
                if (result.status === 'fulfilled') {
                    // Process events for this chunk and update identified players/teams iteratively
                    const { finalEvents, updatedIdentifiedPlayers, updatedIdentifiedTeams } = this.parseAndFilterEvents(result.events, job.gameId, chunkDuration, identifiedPlayers, identifiedTeams);
                    allRawEvents.push(...finalEvents);
                    identifiedPlayers = updatedIdentifiedPlayers; // Update for next iteration
                    identifiedTeams = updatedIdentifiedTeams;     // Update for next iteration
                } else {
                    this.logger.error(`[RETRY_LATER] Chunk failed to process. Chunk Info: ${JSON.stringify(result.chunkInfo)}. Error:`, result.error);
                    currentlyFailedChunks.push(result.chunkInfo);
                }
                overallProgressBar.increment();
            }

            // If ALL chunks failed, then the job is FAILED
            if (allRawEvents.length === 0 && videoChunksToProcess.length > 0) {
                throw new Error("All video chunks failed to process by the Gemini API.");
            }

            overallProgressBar.update(overallProgressBar.getTotal(), { task: 'Finalizing events and identified entities', unit: '' });
            job.processedEvents = allRawEvents; // All events collected
            job.identifiedPlayers = identifiedPlayers; // Final identified players
            job.identifiedTeams = identifiedTeams;     // Final identified teams
            this.logger.info(`VideoProcessorWorker: Parsed and filtered ${job.processedEvents.length} final game events.`);

            // For now, we're not calculating stats here, just storing events.
            // Stats calculation will be part of the result processing on the main backend side.
            job.processedStats = null; // Clear or set an appropriate value if stats were calculated here

            job.failedChunkInfo = currentlyFailedChunks; // Save currently failed chunks back to the job

            if (currentlyFailedChunks.length > 0) {
                job.status = VideoAnalysisJobStatus.RETRYABLE_FAILED;
                this.logger.warn(`Video analysis job ${job.id} for game ${job.gameId} failed | retryable. ${currentlyFailedChunks.length} chunks failed.`);
            } else {
                job.status = VideoAnalysisJobStatus.COMPLETED;
                if (job.failedChunkInfo) { // If it was a retry pass, clear the failedChunkInfo
                    job.failedChunkInfo = null; // Clear failed chunks if successful
                }
                this.logger.info(`VideoProcessorWorker: Successfully processed job ${job.id} for Game ID: ${job.gameId}`);
            }
            await this.jobRepository.update(job);

        } catch (error) {
            this.logger.error(`VideoProcessorWorker: Error processing job ${job.id} for Game ID: ${job.gameId}:`, error);
            job.status = VideoAnalysisJobStatus.FAILED;
            await this.jobRepository.update(job);
        } finally {
            overallProgressBar.update(overallProgressBar.getTotal(), { task: 'Cleaning up chunks', unit: '' });
            // Conditional cleanup based on job status
            if (job.status === VideoAnalysisJobStatus.COMPLETED || job.status === VideoAnalysisJobStatus.FAILED) {
                await this.videoChunkerService.cleanupChunks(videoChunksToProcess.map(c => c.chunkPath));
            } else if (job.status === VideoAnalysisJobStatus.RETRYABLE_FAILED) {
                this.logger.info(`Cleanup: Job ${job.id} is in RETRYABLE_FAILED status. Retaining chunks for potential retry.`);
            } else {
                this.logger.warn(`Cleanup: Job ${job.id} unexpected status ${job.status}. Retaining chunks.`);
            }
            multibar.stop();
            // Always send job result to main backend regardless of success or failure
            await this.sendJobResultToMainBackend(job);
        }
    }

    // New method to send results back to the main backend
    private async sendJobResultToMainBackend(job: VideoAnalysisJob): Promise<void> {
        const resultMessage = {
            jobId: job.id,
            gameId: job.gameId,
            userId: job.userId,
            status: job.status,
            processedEvents: job.processedEvents,
            failedChunkInfo: job.failedChunkInfo,
            // Add other relevant processed data like stats if they were calculated by the worker
        };
        const dataBuffer = Buffer.from(JSON.stringify(resultMessage));

        try {
            const messageId = await this.pubSubClient.topic(VIDEO_ANALYSIS_RESULTS_TOPIC_NAME).publishMessage({ data: dataBuffer });
            this.logger.info(`VideoProcessorWorker: Published job result for Job ID: ${job.id} to ${VIDEO_ANALYSIS_RESULTS_TOPIC_NAME}. Message ID: ${messageId}`);
        } catch (error) {
            this.logger.error(`VideoProcessorWorker: Failed to publish job result for Job ID: ${job.id}:`, error);
        }
    }




    private generateConsistentUuid(input: string): string {
        // Use a namespace for consistency. This can be any valid UUID.
        // Using a fixed namespace ensures that the same input string always produces the same UUID.
        const NAMESPACE_URL = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Example namespace for URL
        return uuidv5(input, NAMESPACE_URL);
    }

    private parseAndFilterEvents(rawEvents: any[], gameId: string, chunkDuration: number, identifiedPlayers: any[], identifiedTeams: any[]): { finalEvents: any[], updatedIdentifiedPlayers: any[], updatedIdentifiedTeams: any[] } {

        this.logger.info("VideoProcessorWorker: Parsing and filtering raw events...");
        const finalEvents: any[] = [];
        const processedEventKeys = new Set<string>(); // To track unique events based on a composite key

        // Create mutable copies for updates
        const currentIdentifiedPlayers = [...identifiedPlayers];
        const currentIdentifiedTeams = [...identifiedTeams];

        for (const rawEvent of rawEvents) {
            // Ensure rawEvent has necessary properties
            if (!rawEvent.eventType || !rawEvent.timestamp || !rawEvent.chunkMetadata || typeof rawEvent.chunkMetadata.startTime === 'undefined') {
                this.logger.warn("Skipping raw event due to missing eventType, timestamp, or chunk metadata:", rawEvent);
                continue;
            }

            // Filter for only allowed event types
            if (!ALLOWED_EVENT_TYPES.includes(rawEvent.eventType)) {
                this.logger.debug(`Filtering out non-gameplay event type: ${rawEvent.eventType}`);
                continue;
            }

            const chunkStartTime = rawEvent.chunkMetadata.startTime;
            let eventTimestampInChunk = 0; // Default if parsing fails

            // Attempt to parse timestamp, handle both HH:MM:SS and MM:SS
            const timestampParts = String(rawEvent.timestamp).split(':').map(Number);
            if (timestampParts.length === 2) {
                eventTimestampInChunk = timestampParts[0] * 60 + timestampParts[1];
            } else if (timestampParts.length === 3) {
                eventTimestampInChunk = timestampParts[0] * 3600 + timestampParts[1] * 60 + timestampParts[2];
            } else {
                this.logger.warn(`Could not parse timestamp format for event: ${rawEvent.timestamp}. Assuming 0.`);
            }

            const absoluteEventTimestamp = chunkStartTime + eventTimestampInChunk; // Absolute timestamp in the original video

            // Ensure only events *started* in the first 2 minutes (120 seconds) of the segment are considered.
            if (eventTimestampInChunk < 120) {
                let assignedTeamId: string | null = null;
                // --- Team Identification ---
                let teamIdentifier = '';
                if (rawEvent.identifiedTeamColor) {
                    teamIdentifier = rawEvent.identifiedTeamColor.toLowerCase();
                } else if (rawEvent.identifiedTeamDescription) {
                    teamIdentifier = rawEvent.identifiedTeamDescription.toLowerCase();
                }

                if (teamIdentifier && rawEvent.assignedTeamType) { // assignedTeamType is crucial for team distinction
                    teamIdentifier = `${rawEvent.assignedTeamType}-${teamIdentifier}`;
                    assignedTeamId = this.generateConsistentUuid(teamIdentifier);

                    // Check if team already identified, if not, add it
                    if (!currentIdentifiedTeams.some(team => team.id === assignedTeamId)) {
                        currentIdentifiedTeams.push({
                            id: assignedTeamId,
                            type: rawEvent.assignedTeamType,
                            color: rawEvent.identifiedTeamColor || null,
                            description: rawEvent.identifiedTeamDescription || null,
                            // Add other relevant info if needed
                        });
                    }
                }

                let assignedPlayerId: string | null = null;
                // --- Player Identification ---
                let playerIdentifier = '';
                if (rawEvent.identifiedJerseyNumber && assignedTeamId) {
                    playerIdentifier = `${assignedTeamId}-${rawEvent.identifiedJerseyNumber}`;
                } else if (rawEvent.identifiedPlayerDescription && assignedTeamId) {
                    playerIdentifier = `${assignedTeamId}-${rawEvent.identifiedPlayerDescription.toLowerCase()}`;
                }

                if (playerIdentifier) {
                    assignedPlayerId = this.generateConsistentUuid(playerIdentifier);

                    // Check if player already identified, if not, add it
                    if (!currentIdentifiedPlayers.some(player => player.id === assignedPlayerId)) {
                        currentIdentifiedPlayers.push({
                            id: assignedPlayerId,
                            teamId: assignedTeamId,
                            jerseyNumber: rawEvent.identifiedJerseyNumber || null,
                            description: rawEvent.identifiedPlayerDescription || null,
                            // Add other relevant info if needed
                        });
                    }
                }


                const gameEventData = {
                    id: rawEvent.id || uuidv4(),
                    gameId: gameId,
                    eventType: rawEvent.eventType,
                    eventSubType: rawEvent.eventSubType || null,
                    isSuccessful: rawEvent.isSuccessful || false,
                    period: rawEvent.period || null,
                    timeRemaining: rawEvent.timeRemaining || null,
                    xCoord: rawEvent.xCoord || null,
                    yCoord: rawEvent.yCoord || null,
                    identifiedTeamColor: rawEvent.identifiedTeamColor || null,
                    identifiedJerseyNumber: rawEvent.identifiedJerseyNumber || null,
                    identifiedPlayerDescription: rawEvent.identifiedPlayerDescription || null, // Store for context
                    identifiedTeamDescription: rawEvent.identifiedTeamDescription || null,     // Store for context
                    assignedTeamId: assignedTeamId, // Use generated ID
                    assignedPlayerId: assignedPlayerId, // Use generated ID
                    relatedEventId: rawEvent.relatedEventId || null,
                    onCourtPlayerIds: rawEvent.onCourtPlayerIds || null,
                    eventDetails: rawEvent.eventDetails || null,
                    absoluteTimestamp: absoluteEventTimestamp,
                    videoClipStartTime: rawEvent.chunkMetadata.startTime, // Start of the chunk
                    videoClipEndTime: rawEvent.chunkMetadata.startTime + chunkDuration, // End of the chunk
                };

                const eventUniqueKey = `${gameEventData.eventType}-${gameEventData.absoluteTimestamp}-${gameEventData.assignedPlayerId || ''}-${gameEventData.identifiedJerseyNumber || ''}`;

                if (!processedEventKeys.has(eventUniqueKey)) {
                    finalEvents.push(gameEventData);
                    processedEventKeys.add(eventUniqueKey);
                } else {
                    this.logger.debug(`Duplicate event detected and filtered: ${eventUniqueKey}`);
                }
            } else {
                this.logger.debug(`Filtering event outside 2-minute window: absoluteTimestamp=${absoluteEventTimestamp}, chunkStartTime=${chunkStartTime}, eventTimestampInChunk=${eventTimestampInChunk}`);
            }
        }
        return {
            finalEvents,
            updatedIdentifiedPlayers: currentIdentifiedPlayers,
            updatedIdentifiedTeams: currentIdentifiedTeams,
        };
    }

    private async cleanupChunks(chunkPaths: string[]): Promise<void> {
        this.logger.info("VideoProcessorWorker: Cleaning up temporary video chunks...");
        for (const chunkPath of chunkPaths) {
            try {
                await fs.promises.unlink(chunkPath);
                this.logger.debug(`Cleaned up chunk: ${chunkPath}`);
            } catch (error) {
                this.logger.warn(`Failed to clean up chunk ${chunkPath}:`, error);
            }
        }
    }
}
