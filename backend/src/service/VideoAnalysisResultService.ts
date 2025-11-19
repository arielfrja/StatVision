import { DataSource } from "typeorm";
import { PubSub, Message } from "@google-cloud/pubsub";
import { GameRepository } from "../repository/GameRepository";
import { GameEventRepository } from "../repository/GameEventRepository";
import { GameStatsService } from "./GameStatsService";
import { GameStatus } from "../Game";
import { GameEvent } from "../GameEvent";
import { GameTeamStatsRepository } from "../repository/GameTeamStatsRepository";
import { GamePlayerStatsRepository } from "../repository/GamePlayerStatsRepository";
import { TeamRepository } from "../repository/TeamRepository"; // New import
import { PlayerRepository } from "../repository/PlayerRepository"; // New import
import { Team } from "../Team"; // New import
import { Player } from "../Player"; // New import
import { GameTeamStats } from "../GameTeamStats"; // New import
import { GamePlayerStats } from "../GamePlayerStats"; // New import
import { VideoAnalysisJobStatus } from "../worker/VideoAnalysisJob";
import { v4 as uuidv4 } from 'uuid';

const VIDEO_ANALYSIS_RESULTS_TOPIC_NAME = process.env.VIDEO_ANALYSIS_RESULTS_TOPIC_NAME || 'video-analysis-results';
const VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME = process.env.VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME || 'video-analysis-results-sub';

interface VideoAnalysisJobResultMessage {
    jobId: string;
    gameId: string;
    userId: string;
    status: VideoAnalysisJobStatus; // This will be the final status for the Game entity
    processedEvents: any[]; // Raw events from the worker
    failedChunkInfo: any[] | null;
    identifiedPlayers: any[] | null; // New field
    identifiedTeams: any[] | null; // New field
    // Add other relevant processed data like stats if they were calculated by the worker
}

import * as winston from 'winston'; // Import winston for typing the logger

export class VideoAnalysisResultService {
    private gameRepository: GameRepository;
    private gameEventRepository: GameEventRepository;
    private gameStatsService: GameStatsService;
    private pubSubClient: PubSub;
    private logger: winston.Logger; // Add a private logger property
    private teamRepository: TeamRepository; // New property
    private playerRepository: PlayerRepository; // New property

    constructor(dataSource: DataSource, logger: winston.Logger) { // Accept logger in constructor
        this.gameRepository = new GameRepository(dataSource);
        this.gameEventRepository = new GameEventRepository(dataSource);
        this.teamRepository = new TeamRepository(dataSource.getRepository(Team)); // Initialize new repository
        this.playerRepository = new PlayerRepository(dataSource); // Initialize new repository
        const gameTeamStatsRepository = new GameTeamStatsRepository(dataSource);
        this.logger = logger; // Assign the passed logger
        const gamePlayerStatsRepository = new GamePlayerStatsRepository(dataSource);
        this.gameStatsService = new GameStatsService(
            this.gameRepository,
            gameTeamStatsRepository,
            gamePlayerStatsRepository
        );
        this.pubSubClient = new PubSub({ projectId: process.env.GCP_PROJECT_ID });
    }

    public async startConsumingResults(): Promise<void> {
        this.logger.info("VideoAnalysisResultService: Starting to consume analysis results from Pub/Sub...", { phase: 'results_processing' });
        const subscription = this.pubSubClient.topic(VIDEO_ANALYSIS_RESULTS_TOPIC_NAME).subscription(VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME);

        subscription.on('message', async (message: Message) => {
            this.logger.info(`Received analysis result message ${message.id}:`, { phase: 'results_processing' });
            this.logger.info(`\tData: ${message.data}`, { phase: 'results_processing' });

            try {
                const result: VideoAnalysisJobResultMessage = JSON.parse(message.data.toString());
                await this.processAnalysisResult(result);
                message.ack();
            } catch (error) {
                this.logger.error(`Error processing analysis result message ${message.id}:`, { error, phase: 'results_processing' });
                message.nack();
            }
        });

        subscription.on('error', (error) => {
            this.logger.error("Pub/Sub analysis results subscription error:", { error, phase: 'results_processing' });
        });

        this.logger.info(`VideoAnalysisResultService: Listening for results on subscription: ${VIDEO_ANALYSIS_RESULTS_SUBSCRIPTION_NAME}`, { phase: 'results_processing' });
    }

    private async processAnalysisResult(result: VideoAnalysisJobResultMessage): Promise<void> {
        this.logger.info(`Processing analysis result for Game ID: ${result.gameId}, Job ID: ${result.jobId}`, { phase: 'results_processing' });

        try {
            let gameStatusToUpdate: GameStatus;
            if (result.status === VideoAnalysisJobStatus.COMPLETED) {
                gameStatusToUpdate = GameStatus.ANALYZED;
            } else if (result.status === VideoAnalysisJobStatus.RETRYABLE_FAILED) {
                gameStatusToUpdate = GameStatus.ANALYSIS_FAILED_RETRYABLE;
            } else if (result.status === VideoAnalysisJobStatus.FAILED) {
                gameStatusToUpdate = GameStatus.FAILED;
            } else {
                this.logger.warn(`Unknown job status received: ${result.status}. Defaulting to FAILED.`, { phase: 'results_processing' });
                gameStatusToUpdate = GameStatus.FAILED;
            }

            // 1. Update Game Status and failedChunkInfo
            await this.gameRepository.updateStatus(result.gameId, gameStatusToUpdate, result.failedChunkInfo);

            // Maps to store workerId -> backendId
            const workerTeamIdToBackendIdMap = new Map<string, string>();
            const workerPlayerIdToBackendIdMap = new Map<string, string>();

            // Collect all unique worker-generated team and player IDs from processedEvents
            const uniqueWorkerTeamIds = new Set<string>();
            const uniqueWorkerPlayerIds = new Set<string>();

            if (result.processedEvents) {
                for (const eventData of result.processedEvents) {
                    if (eventData.assignedTeamId) {
                        uniqueWorkerTeamIds.add(eventData.assignedTeamId);
                    }
                    if (eventData.assignedPlayerId) {
                        uniqueWorkerPlayerIds.add(eventData.assignedPlayerId);
                    }
                }
            }

            // Create backend Team entities for unique worker team IDs
            for (const workerTeamId of uniqueWorkerTeamIds) {
                const newBackendTeamId = uuidv4();
                const team = new Team();
                team.id = newBackendTeamId;
                team.name = `Worker Team ${workerTeamId.substring(0, 7)}`; // Placeholder name
                team.isTemp = true;
                team.userId = result.userId; // Associate with the user who initiated the job
                await this.teamRepository.save(team);
                workerTeamIdToBackendIdMap.set(workerTeamId, newBackendTeamId);
                this.logger.debug(`Created temp backend team ${newBackendTeamId} for worker ID ${workerTeamId}`, { phase: 'results_processing' });
            }

            // Create backend Player entities for unique worker player IDs
            for (const workerPlayerId of uniqueWorkerPlayerIds) {
                const newBackendPlayerId = uuidv4();
                const player = new Player();
                player.id = newBackendPlayerId;
                player.name = `Worker Player ${workerPlayerId.substring(0, 7)}`; // Placeholder name
                player.isTemp = true;
                // Player's team will be assigned via GameEvent, not directly on Player entity
                await this.playerRepository.save(player);
                workerPlayerIdToBackendIdMap.set(workerPlayerId, newBackendPlayerId);
                this.logger.debug(`Created temp backend player ${newBackendPlayerId} for worker ID ${workerPlayerId}`, { phase: 'results_processing' });
            }

            // 2. Persist Identified Teams and Players (This section will be modified or removed as per new logic)
            if (gameStatusToUpdate === GameStatus.ANALYZED) {
                // The logic below for identifiedTeams and identifiedPlayers is based on the old assumption
                // that worker IDs are persistent. We will adapt it or remove it if not needed.
                // For now, we'll keep it but it will likely be empty based on worker.log.

                // Persist Teams
                if (result.identifiedTeams && result.identifiedTeams.length > 0) {
                    for (const teamData of result.identifiedTeams) {
                        // 1. Find or Create Generic Team
                        let team = await this.teamRepository.findOneById(teamData.id);
                        if (!team) {
                            team = new Team();
                            team.id = teamData.id;
                            // Assuming teamData might contain a name for the generic team
                            team.name = teamData.name || `Team ${teamData.id.substring(0, 4)}`;
                            await this.teamRepository.save(team); // Use save to persist new generic team
                            this.logger.debug(`Persisted new generic team: ${team.id}`, { phase: 'results_processing' });
                        }

                        // 2. Find or Create GameTeamStats and update game-specific details
                        let gameTeamStats = (await this.gameStatsService.getGameTeamStats(result.gameId, teamData.id)) || new GameTeamStats();
                        gameTeamStats.gameId = result.gameId;
                        gameTeamStats.teamId = teamData.id;
                        gameTeamStats.type = teamData.type;
                        gameTeamStats.color = teamData.color;
                        gameTeamStats.description = teamData.description;
                        await this.gameStatsService.saveGameTeamStats(gameTeamStats);
                        this.logger.debug(`Updated GameTeamStats for game ${result.gameId} and team ${teamData.id} with identified details.`, { phase: 'results_processing' });
                    }
                    this.logger.info(`Successfully processed ${result.identifiedTeams.length} identified teams for game ${result.gameId}.`, { phase: 'results_processing' });
                }

                // Persist Players
                if (result.identifiedPlayers && result.identifiedPlayers.length > 0) {
                    for (const playerData of result.identifiedPlayers) {
                        // 1. Find or Create Generic Player
                        let player = await this.playerRepository.findOneById(playerData.id);
                        if (!player) {
                            player = new Player();
                            player.id = playerData.id;
                            // Assuming playerData might contain a name for the generic player
                            player.name = playerData.name || `Player ${playerData.id.substring(0, 4)}`;
                            await this.playerRepository.save(player); // Use save to persist new generic player
                            this.logger.debug(`Persisted new generic player: ${player.id}`, { phase: 'results_processing' });
                        }

                        // 2. Find or Create GamePlayerStats and update game-specific details
                        let gamePlayerStats = (await this.gameStatsService.getGamePlayerStats(result.gameId, playerData.id)) || new GamePlayerStats();
                        gamePlayerStats.gameId = result.gameId;
                        gamePlayerStats.playerId = playerData.id;
                        gamePlayerStats.teamId = playerData.teamId;
                        gamePlayerStats.jerseyNumber = playerData.jerseyNumber;
                        gamePlayerStats.description = playerData.description;
                        await this.gameStatsService.saveGamePlayerStats(gamePlayerStats);
                        this.logger.debug(`Updated GamePlayerStats for game ${result.gameId} and player ${playerData.id} with identified details.`, { phase: 'results_processing' });
                    }
                    this.logger.info(`Successfully processed ${result.identifiedPlayers.length} identified players for game ${result.gameId}.`, { phase: 'results_processing' });
                }
            }

            // 3. Insert Game Events (if job was successful)
            if (gameStatusToUpdate === GameStatus.ANALYZED && result.processedEvents && result.processedEvents.length > 0) {
                const gameEventsToInsert = result.processedEvents.map(eventData => {
                    const gameEvent = new GameEvent();
                    Object.assign(gameEvent, eventData);
                    gameEvent.gameId = result.gameId; // Ensure gameId is set;

                    // Map worker-generated IDs to backend IDs
                    if (eventData.assignedTeamId) {
                        gameEvent.assignedTeamId = workerTeamIdToBackendIdMap.get(eventData.assignedTeamId) || null;
                    }
                    if (eventData.assignedPlayerId) {
                        gameEvent.assignedPlayerId = workerPlayerIdToBackendIdMap.get(eventData.assignedPlayerId) || null;
                    }

                    return gameEvent;
                });
                await this.gameEventRepository.batchInsert(gameEventsToInsert);
                this.logger.info(`Successfully inserted ${gameEventsToInsert.length} events for game ${result.gameId}.`, { phase: 'results_processing' });
            } else if (gameStatusToUpdate === GameStatus.ANALYZED && (!result.processedEvents || result.processedEvents.length === 0)) {
                this.logger.warn(`No events to insert for successfully analyzed game ${result.gameId}.`, { phase: 'results_processing' });
            }

            // 3. Calculate and Store Derived Stats (if job was successful)
            if (gameStatusToUpdate === GameStatus.ANALYZED) {
                await this.gameStatsService.calculateAndStoreStats(result.gameId);
                this.logger.info(`Successfully calculated and stored stats for game ${result.gameId}.`, { phase: 'results_processing' });
            }

            this.logger.info(`Finished processing analysis result for Game ID: ${result.gameId}. Final Status: ${result.status}`, { phase: 'results_processing' });

        } catch (error) {
            this.logger.error(`Error in processAnalysisResult for Game ID: ${result.gameId}:`, { error, phase: 'results_processing' });
            // If processing the result fails, we might want to update the game status to a specific error state
            // or re-nack the message if this service has its own subscription.
            // For now, just log the error.
        }
    }
}
