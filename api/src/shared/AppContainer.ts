import { DataSource } from "typeorm";
import * as path from 'path';
import { 
    TeamService, PlayerService, GameStatsService, 
    TeamRepository, PlayerRepository, GameRepository, 
    GameEventRepository, GameTeamStatsRepository, 
    GamePlayerStatsRepository, UserRepository,
    AppError, User, Team, ILogger,
    PubSubEventBus, IEventBus,
    GCSStorageProvider, LocalStorageProvider, IStorageProvider,
    AiUsageService, GeminiProvider
} from "@statvision/common";
import { GameService } from "../modules/games/GameService";
import { GameAssignmentService } from "../modules/games/GameAssignmentService";
import { GameAnalysisService } from "../modules/games/GameAnalysisService";
import { VideoAnalysisResultService } from "../service/VideoAnalysisResultService";
import { ProgressSubscriberService } from "../service/ProgressSubscriberService";
import { JobWatchdogService } from "../service/JobWatchdogService";
import { NotificationService } from "../service/NotificationService";
import { CleanupService } from "../service/CleanupService";
import logger from "../config/logger";

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
        const commonLogger = logger as unknown as ILogger;
        const eventBus = new PubSubEventBus(commonLogger);
        this.services.set("IEventBus", eventBus);

        const notificationService = new NotificationService();
        this.services.set(NotificationService.name, notificationService);

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

        const cleanupService = new CleanupService(storageProvider);
        this.services.set(CleanupService.name, cleanupService);

        // Repositories
        const userRepository = new UserRepository(this.dataSource, commonLogger);
        const teamRepository = new TeamRepository(this.dataSource.getRepository(Team), commonLogger);
        const playerRepository = new PlayerRepository(this.dataSource, commonLogger);
        const gameRepository = new GameRepository(this.dataSource, commonLogger);
        const gameEventRepository = new GameEventRepository(this.dataSource, commonLogger);
        const teamStatsRepository = new GameTeamStatsRepository(this.dataSource, commonLogger);
        const playerStatsRepository = new GamePlayerStatsRepository(this.dataSource, commonLogger);

        // Services
        const teamService = new TeamService(this.dataSource, commonLogger);
        const gameService = new GameService(this.dataSource, storageProvider);
        const aiUsageService = new AiUsageService(this.dataSource);
        
        const gameStatsService = new GameStatsService(
            gameRepository,
            teamStatsRepository,
            playerStatsRepository,
            commonLogger
        );
        
        const geminiModelName = process.env.GEMINI_MODEL_NAME;
        if (!geminiModelName) {
            throw new Error('MISSING_CONFIG: GEMINI_MODEL_NAME environment variable is required.');
        }
        const geminiProvider = new GeminiProvider(
            process.env.GEMINI_API_KEY || '',
            geminiModelName,
            commonLogger
        );

        const playerService = new PlayerService(this.dataSource, gameStatsService, commonLogger);
        const gameAssignmentService = new GameAssignmentService(this.dataSource, gameStatsService);
        const gameAnalysisService = new GameAnalysisService(this.dataSource, geminiProvider);
        
        const videoAnalysisResultService = new VideoAnalysisResultService(
            this.dataSource, 
            logger, 
            gameStatsService, 
            eventBus, 
            notificationService,
            cleanupService
        );
        const jobWatchdogService = new JobWatchdogService(this.dataSource, notificationService);
        const progressSubscriberService = new ProgressSubscriberService(eventBus, notificationService);

        // Registering services
        this.services.set(TeamService.name, teamService);
        this.services.set(PlayerService.name, playerService);
        this.services.set(GameService.name, gameService);
        this.services.set(GameStatsService.name, gameStatsService);
        this.services.set(GameAssignmentService.name, gameAssignmentService);
        this.services.set(GameAnalysisService.name, gameAnalysisService);
        this.services.set(AiUsageService.name, aiUsageService);
        this.services.set(VideoAnalysisResultService.name, videoAnalysisResultService);
        this.services.set(JobWatchdogService.name, jobWatchdogService);
        this.services.set(ProgressSubscriberService.name, progressSubscriberService);

        // Registering repositories
        this.services.set("UserRepository", userRepository);
        this.services.set(TeamRepository.name, teamRepository);
        this.services.set(PlayerRepository.name, playerRepository);
        this.services.set(GameRepository.name, gameRepository);
        this.services.set(GameEventRepository.name, gameEventRepository);
        this.services.set(GameTeamStatsRepository.name, teamStatsRepository);
        this.services.set(GamePlayerStatsRepository.name, playerStatsRepository);
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
