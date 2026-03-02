import { DataSource } from "typeorm";
import { TeamService } from "../service/TeamService";
import { PlayerService } from "../service/PlayerService";
import { GameService } from "../modules/games/GameService";
import { GameStatsService } from "../service/GameStatsService";
import { GameAssignmentService } from "../modules/games/GameAssignmentService";
import { GameAnalysisService } from "../modules/games/GameAnalysisService";
import { VideoAnalysisResultService } from "../service/VideoAnalysisResultService";
import { TeamRepository } from "../repository/TeamRepository";
import { PlayerRepository } from "../repository/PlayerRepository";
import { GameRepository } from "../repository/GameRepository";
import { GameEventRepository } from "../repository/GameEventRepository";
import { GameTeamStatsRepository } from "../repository/GameTeamStatsRepository";
import { GamePlayerStatsRepository } from "../repository/GamePlayerStatsRepository";
import { AppError } from "../core/errors/AppError";
import logger from "../config/logger";
import { User } from "../core/entities/User";
import { Team } from "../core/entities/Team";
import { UserRepository } from "../repository/UserRepository";
import { PubSubEventBus } from "../worker/infrastructure/PubSubEventBus";
import { IEventBus } from "../core/interfaces/IEventBus";
import { VideoOrchestratorService } from "../worker/videoProcessorWorker";
import { ChunkProcessorWorker } from "../worker/ChunkProcessorWorker";
import { JobFinalizerService } from "../worker/JobFinalizerService";
import { VideoAnalysisJobRepository } from "../worker/VideoAnalysisJobRepository";

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
        // Infrastructure
        const eventBus = new PubSubEventBus();
        this.services.set("IEventBus", eventBus);

        // Repositories
        const userRepository = new UserRepository(this.dataSource);
        const teamRepository = new TeamRepository(this.dataSource.getRepository(Team));
        const playerRepository = new PlayerRepository(this.dataSource);
        const gameRepository = new GameRepository(this.dataSource);
        const gameEventRepository = new GameEventRepository(this.dataSource);
        const teamStatsRepository = new GameTeamStatsRepository(this.dataSource);
        const playerStatsRepository = new GamePlayerStatsRepository(this.dataSource);
        const videoAnalysisJobRepository = new VideoAnalysisJobRepository(this.dataSource);

        // Services
        const teamService = new TeamService(this.dataSource);
        const playerService = new PlayerService(this.dataSource, gameStatsService);
        const gameService = new GameService(this.dataSource);
        
        const gameStatsService = new GameStatsService(
            gameRepository,
            teamStatsRepository,
            playerStatsRepository
        );
        
        const gameAssignmentService = new GameAssignmentService(this.dataSource, gameStatsService);
        const gameAnalysisService = new GameAnalysisService(this.dataSource);
        
        // VideoAnalysisResultService requires logger and gameStatsService
        const videoAnalysisResultService = new VideoAnalysisResultService(this.dataSource, logger, gameStatsService, eventBus);

        // Worker Services
        const jobFinalizerService = new JobFinalizerService(this.dataSource, eventBus);
        const videoOrchestratorService = new VideoOrchestratorService(this.dataSource, eventBus);
        const chunkProcessorWorker = new ChunkProcessorWorker(this.dataSource, eventBus);

        // Registering services
        this.services.set(TeamService.name, teamService);
        this.services.set(PlayerService.name, playerService);
        this.services.set(GameService.name, gameService);
        this.services.set(GameStatsService.name, gameStatsService);
        this.services.set(GameAssignmentService.name, gameAssignmentService);
        this.services.set(GameAnalysisService.name, gameAnalysisService);
        this.services.set(VideoAnalysisResultService.name, videoAnalysisResultService);
        this.services.set(JobFinalizerService.name, jobFinalizerService);
        this.services.set(VideoOrchestratorService.name, videoOrchestratorService);
        this.services.set(ChunkProcessorWorker.name, chunkProcessorWorker);

        // Registering repositories
        this.services.set("UserRepository", userRepository);
        this.services.set(TeamRepository.name, teamRepository);
        this.services.set(PlayerRepository.name, playerRepository);
        this.services.set(GameRepository.name, gameRepository);
        this.services.set(GameEventRepository.name, gameEventRepository);
        this.services.set(GameTeamStatsRepository.name, teamStatsRepository);
        this.services.set(GamePlayerStatsRepository.name, playerStatsRepository);
        this.services.set("VideoAnalysisJobRepository", videoAnalysisJobRepository);
    }

    public get<T>(serviceIdentifier: string | Function): T {
        const key = typeof serviceIdentifier === 'string' ? serviceIdentifier : serviceIdentifier.name;
        const service = this.services.get(key);
        if (!service) {
            throw new AppError(`Service ${key} not found. Make sure it's registered in AppContainer.`, 500);
        }
        return service as T;
    }
}
