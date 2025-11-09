import dotenv from 'dotenv';
import path from 'path';
import logger from "./config/logger";

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

logger.info(`Attempting to load .env from: ${envPath}`);
logger.info(`PORT after dotenv.config(): ${process.env.PORT}`);

import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { Player } from "./Player";
import { PlayerTeamHistory } from "./PlayerTeamHistory";
import { Game } from "./Game";
import { GameEvent } from "./GameEvent";
import { GameTeamStats } from "./GameTeamStats";
import { GamePlayerStats } from "./GamePlayerStats";
import { TeamRepository } from "./repository/TeamRepository";
import { GameEventRepository } from "./repository/GameEventRepository";
import { TeamService } from "./service/TeamService";
import { PlayerRepository } from "./repository/PlayerRepository";
import { PlayerService } from "./service/PlayerService";
import { GameRepository } from "./repository/GameRepository";
import { GameService } from "./service/GameService";
import { GameStatsService } from "./service/GameStatsService";
import { GameTeamStatsRepository } from "./repository/GameTeamStatsRepository";
import { GamePlayerStatsRepository } from "./repository/GamePlayerStatsRepository";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { getAuthProvider } from "./auth/authProviderFactory";
import { authMiddleware } from './middleware/authMiddleware';
import { authRoutes } from "./routes/authRoutes";
import { teamRoutes } from "./routes/teamRoutes";
import { playerRoutes } from "./routes/playerRoutes";
import { gameRoutes } from "./routes/gameRoutes";
import loggingMiddleware from './middleware/loggingMiddleware';
import errorMiddleware from './middleware/errorMiddleware';
import { IAuthProvider } from "./auth/authProvider";

  logger.debug("Environment Variables Loaded:");
  logger.debug(`PORT: ${process.env.PORT}`);
  logger.debug(`NODE_ENV: ${process.env.NODE_ENV}`);
  logger.debug(`AUTH0_JWKS_URI: ${process.env.AUTH0_JWKS_URI}`);
  logger.debug(`AUTH0_AUDIENCE: ${process.env.AUTH0_AUDIENCE}`);
  logger.debug(`AUTH0_ISSUER: ${process.env.AUTH0_ISSUER}`);
  logger.debug(`DB_HOST: ${process.env.DB_HOST}`);
  logger.debug(`DB_PORT: ${process.env.DB_PORT}`);
  logger.debug(`DB_USERNAME: ${process.env.DB_USERNAME}`);
  logger.debug(`DB_DATABASE: ${process.env.DB_DATABASE}`);

// Extend the Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: { uid: string; email: string | null; }; // Generic user info
        }
    }
}

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false, // Use migrations in production
    logging: false,
    entities: [User, Team, Player, PlayerTeamHistory, Game, GameEvent, GameTeamStats, GamePlayerStats],
    subscribers: [],
    migrations: [__dirname + "/migration/**/*.ts"],
});

const app = express();
app.use(cors({ origin: (origin, callback) => callback(null, origin), credentials: true }));
app.use(express.json()); // Enable JSON body parser

// Middleware to log all incoming request headers
app.use((req, res, next) => {
    logger.debug("Incoming Request Headers:", req.headers);
    next();
});

// Log all incoming requests
app.use(loggingMiddleware);

// Error handling middleware
app.use(errorMiddleware);

// Swagger definition
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'StatVision API',
            version: '1.0.0',
            description: 'API documentation for the StatVision backend application',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
        schemas: {
            Game: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', example: 'firebaseUid123' },
                    status: { type: 'string', enum: ['UPLOADED', 'PROCESSING', 'ANALYZED', 'ASSIGNMENT_PENDING', 'COMPLETED', 'FAILED'] },
                    videoUrl: { type: 'string', nullable: true, example: '/path/to/local/video.mp4' },
                    assignedTeamAId: { type: 'string', format: 'uuid', nullable: true },
                    assignedTeamBId: { type: 'string', format: 'uuid', nullable: true },
                    uploadedAt: { type: 'string', format: 'date-time' },
                },
            },
            GameEvent: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    gameId: { type: 'string', format: 'uuid' },
                    assignedTeamId: { type: 'string', format: 'uuid', nullable: true },
                    assignedPlayerId: { type: 'string', format: 'uuid', nullable: true },
                    identifiedTeamColor: { type: 'string', nullable: true },
                    identifiedJerseyNumber: { type: 'number', nullable: true },
                    eventType: { type: 'string' },
                    eventDetails: { type: 'object', nullable: true, description: 'JSONB field for event-specific data' },
                    absoluteTimestamp: { type: 'number', format: 'float' },
                    videoClipStartTime: { type: 'number', format: 'float' },
                    videoClipEndTime: { type: 'number', format: 'float' },
                },
            },
            Team: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    name: { type: 'string', example: 'My Awesome Team' },
                    userId: { type: 'string', example: 'firebaseUid123' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            Player: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    name: { type: 'string', example: 'John Doe' },
                    jerseyNumber: { type: 'number', example: 10 },
                    teamId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
    apis: ['./src/*.ts', './src/routes/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let authProvider: IAuthProvider; // Declare authProvider here

AppDataSource.initialize()
    .then(() => {
        logger.info("Data Source has been initialized!");

        const jwksUri = process.env.AUTH0_JWKS_URI;
        const audience = process.env.AUTH0_AUDIENCE;
        const issuer = process.env.AUTH0_ISSUER;

        if (!jwksUri || !audience || !issuer) {
            throw new Error("Missing Auth0 environment variables: AUTH0_JWKS_URI, AUTH0_AUDIENCE, or AUTH0_ISSUER.");
        }

        // Instantiate the Auth0 provider using the factory
        authProvider = getAuthProvider(
            jwksUri,
            audience,
            issuer
        );

        // Instantiate Repositories and Services
        const gameRepository = new GameRepository(AppDataSource);
        const gameEventRepository = new GameEventRepository(AppDataSource);
        const userRepository = AppDataSource.getRepository(User); // Get the base User repository
        const teamStatsRepository = new GameTeamStatsRepository(AppDataSource);
        const playerStatsRepository = new GamePlayerStatsRepository(AppDataSource);
        const teamRepository = new TeamRepository(AppDataSource.getRepository(Team));
        const playerRepository = new PlayerRepository(AppDataSource);
        
        const teamService = new TeamService(AppDataSource); // Updated to take AppDataSource
        const playerService = new PlayerService(AppDataSource); // Updated to take AppDataSource

        const gameService = new GameService(
            gameRepository, 
            userRepository,
            gameEventRepository,
            teamRepository,
            playerRepository,
            playerStatsRepository
        ); // Refactored
        const gameStatsService = new GameStatsService( // New
            gameRepository,
            teamStatsRepository,
            playerStatsRepository
        );

        // Apply authMiddleware globally
        app.use(authMiddleware(AppDataSource, authProvider));

        // Import and use routes
        app.use("/", authRoutes(AppDataSource));
        app.use("/teams", teamRoutes(AppDataSource, teamService)); // Pass teamService
        app.use("/teams/:teamId/players", playerRoutes(AppDataSource, teamService, playerService)); // Pass services
        app.use("/games", gameRoutes(AppDataSource, gameService, gameStatsService, gameEventRepository));

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    })
    .catch((err: any) => {
        logger.error("Error during Data Source initialization:", err);
    });