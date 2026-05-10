import { DataSource } from "typeorm";
import { 
    TeamService, PlayerService, GameStatsService, 
    TeamRepository, PlayerRepository, GameRepository, 
    GameEventRepository, GameTeamStatsRepository, 
    GamePlayerStatsRepository, UserRepository,
    User, Team, ILogger, IEventBus
} from "@statvision/common";
import { VideoAnalysisResultService } from "../service/VideoAnalysisResultService";
import { PubSubEventBus } from "../worker/infrastructure/PubSubEventBus";
import { jobLogger } from "../config/loggers";

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
        const eventBus = new PubSubEventBus();
        this.services.set("IEventBus", eventBus);

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
        
        const gameStatsService = new GameStatsService(
            gameRepository,
            teamStatsRepository,
            playerStatsRepository,
            commonLogger
        );
        
        const playerService = new PlayerService(this.dataSource, gameStatsService, commonLogger);
        const videoAnalysisResultService = new VideoAnalysisResultService(this.dataSource, jobLogger, gameStatsService, eventBus);

        // Registering services
        this.services.set(TeamService.name, teamService);
        this.services.set(PlayerService.name, playerService);
        this.services.set(GameStatsService.name, gameStatsService);
        this.services.set(VideoAnalysisResultService.name, videoAnalysisResultService);

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
            throw new Error(`Service ${key} not found.`);
        }
        return service as T;
    }
}
