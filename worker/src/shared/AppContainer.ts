import { DataSource } from "typeorm";
import * as path from 'path';
import {
    TeamService, PlayerService, GameStatsService,
    TeamRepository, PlayerRepository, GameRepository,
    GameEventRepository, GameTeamStatsRepository,
    GamePlayerStatsRepository, UserRepository,
    User, Team, ILogger, IEventBus,
    PubSubEventBus, GCSStorageProvider, LocalStorageProvider, IStorageProvider
} from "@statvision/common";
import { VideoAnalysisResultService } from "../service/VideoAnalysisResultService";
import { jobLogger } from "../config/loggers";
import { VideoAnalysisJobRepository } from "../worker/VideoAnalysisJobRepository";
import { ChunkRepository } from "../worker/ChunkRepository";
import { JobFinalizerService } from "../worker/JobFinalizerService";
import { VideoOrchestratorService } from "../worker/videoProcessorWorker";
import { ChunkProcessorWorker } from "../worker/ChunkProcessorWorker";
import { ProgressManager } from "../worker/ProgressManager";

export class AppContainer {
    private static instance: AppContainer;
    private dataSource: DataSource;
    private services: Map<string, any> = new Map();

    private constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
        this.registerServices();
    }

    public static getInstance(dataSource: DataSource): AppContainer {
        if (!AppContainer.instance) {
            AppContainer.instance = new AppContainer(dataSource);
        }
        return AppContainer.instance;
    }

    private registerServices(): void {
        const commonLogger = jobLogger as unknown as ILogger;

        // Infrastructure
        const eventBus = new PubSubEventBus(commonLogger);
        this.services.set("IEventBus", eventBus);

        let storageProvider: IStorageProvider;
        if (process.env.NODE_ENV === 'production') {
            storageProvider = new GCSStorageProvider(
                process.env.UPLOAD_BUCKET || 'statvision-uploads-prod', 
                commonLogger
            );
        } else {
            storageProvider = new LocalStorageProvider(
                path.join(process.cwd(), '../storage'),
                commonLogger
            );
        }
        this.services.set("IStorageProvider", storageProvider);
        // Repositories (Common)
        const userRepository = new UserRepository(this.dataSource, commonLogger);
        const teamRepository = new TeamRepository(this.dataSource.getRepository(Team), commonLogger);
        const playerRepository = new PlayerRepository(this.dataSource, commonLogger);
        const gameRepository = new GameRepository(this.dataSource, commonLogger);
        const gameEventRepository = new GameEventRepository(this.dataSource, commonLogger);
        const teamStatsRepository = new GameTeamStatsRepository(this.dataSource, commonLogger);
        const playerStatsRepository = new GamePlayerStatsRepository(this.dataSource, commonLogger);

        // Repositories (Worker Local)
        const videoAnalysisJobRepository = new VideoAnalysisJobRepository(this.dataSource);
        const chunkRepository = new ChunkRepository(this.dataSource);

        // Progress Manager
        const progressManager = new ProgressManager(eventBus, videoAnalysisJobRepository);

        // Services
        const teamService = new TeamService(this.dataSource, commonLogger);
        
        const gameStatsService = new GameStatsService(
            gameRepository,
            teamStatsRepository,
            playerStatsRepository,
            commonLogger
        );
        
        const playerService = new PlayerService(this.dataSource, gameStatsService, commonLogger);
        const videoAnalysisResultService = new VideoAnalysisResultService(this.dataSource, jobLogger, gameStatsService, eventBus);
        const jobFinalizerService = new JobFinalizerService(this.dataSource, eventBus, progressManager);
        const videoOrchestratorService = new VideoOrchestratorService(this.dataSource, eventBus, progressManager, storageProvider);
        const chunkProcessorWorker = new ChunkProcessorWorker(this.dataSource, eventBus, progressManager);

        // Registering services
        this.services.set(TeamService.name, teamService);
        this.services.set(PlayerService.name, playerService);
        this.services.set(GameStatsService.name, gameStatsService);
        this.services.set(VideoAnalysisResultService.name, videoAnalysisResultService);
        this.services.set(JobFinalizerService.name, jobFinalizerService);
        this.services.set(VideoOrchestratorService.name, videoOrchestratorService);
        this.services.set(ChunkProcessorWorker.name, chunkProcessorWorker);
        this.services.set(ProgressManager.name, progressManager);

        // Registering repositories
        this.services.set("UserRepository", userRepository);
        this.services.set(TeamRepository.name, teamRepository);
        this.services.set(PlayerRepository.name, playerRepository);
        this.services.set(GameRepository.name, gameRepository);
        this.services.set(GameEventRepository.name, gameEventRepository);
        this.services.set(GameTeamStatsRepository.name, teamStatsRepository);
        this.services.set(GamePlayerStatsRepository.name, playerStatsRepository);
        
        // Local Repositories
        this.services.set("VideoAnalysisJobRepository", videoAnalysisJobRepository);
        this.services.set(ChunkRepository.name, chunkRepository);
    }

    public get<T>(serviceIdentifier: string | Function): T {
        const key = typeof serviceIdentifier === 'string' ? serviceIdentifier : serviceIdentifier.name;
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service ${key} not found.`);
        }
        return service as T;
    }
}
