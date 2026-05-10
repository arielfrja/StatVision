import { DataSource } from "typeorm";
import { 
    TeamService, PlayerService, GameStatsService, 
    TeamRepository, PlayerRepository, GameRepository, 
    GameEventRepository, GameTeamStatsRepository, 
    GamePlayerStatsRepository, UserRepository,
    AppError, User, Team, ILogger
} from "@statvision/common";
import { GameService } from "../modules/games/GameService";
import { GameAssignmentService } from "../modules/games/GameAssignmentService";
import { GameAnalysisService } from "../modules/games/GameAnalysisService";
import { VideoAnalysisResultService } from "../service/VideoAnalysisResultService";
import logger from "../config/logger";
import { IEventBus } from "../core/interfaces/IEventBus";

// Simple mock for API to compile
class MockEventBus implements IEventBus {
    async publish(topic: string, message: any): Promise<void> {
        console.log(`[MockEventBus] Publishing to ${topic}`);
    }
    async subscribe(subscriptionName: string, handler: (data: any, originalMessage: any) => Promise<void>, options?: any): Promise<void> {
        console.log(`[MockEventBus] Subscribed to ${subscriptionName}`);
    }
}

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
        const eventBus = new MockEventBus();
        this.services.set("IEventBus", eventBus);
        const commonLogger = logger as unknown as ILogger;

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
        const gameService = new GameService(this.dataSource);
        
        const gameStatsService = new GameStatsService(
            gameRepository,
            teamStatsRepository,
            playerStatsRepository,
            commonLogger
        );
        
        const playerService = new PlayerService(this.dataSource, gameStatsService, commonLogger);
        const gameAssignmentService = new GameAssignmentService(this.dataSource, gameStatsService);
        const gameAnalysisService = new GameAnalysisService(this.dataSource);
        
        const videoAnalysisResultService = new VideoAnalysisResultService(this.dataSource, logger, gameStatsService, eventBus);

        // Registering services
        this.services.set(TeamService.name, teamService);
        this.services.set(PlayerService.name, playerService);
        this.services.set(GameService.name, gameService);
        this.services.set(GameStatsService.name, gameStatsService);
        this.services.set(GameAssignmentService.name, gameAssignmentService);
        this.services.set(GameAnalysisService.name, gameAnalysisService);
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
            throw new AppError(`Service ${key} not found. Make sure it's registered in AppContainer.`, 500);
        }
        return service as T;
    }
}
