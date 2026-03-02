import dotenv from 'dotenv';
import path from 'path';
import logger from "./config/logger";

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { getAuthProvider } from "./auth/authProviderFactory";
import { authMiddleware } from './middleware/authMiddleware';
import { authRoutes } from "./routes/authRoutes";
import { teamRoutes } from "./routes/teamRoutes";
import { playerRoutes } from "./routes/playerRoutes";
import { playerGlobalRoutes } from "./routes/playerGlobalRoutes";
import { gameRoutes } from "./routes/gameRoutes";
import loggingMiddleware from './middleware/loggingMiddleware';
import errorMiddleware from './middleware/errorMiddleware';
import { IAuthProvider } from "./auth/authProvider";
import { AppContainer } from "./shared/AppContainer";
import { TeamService } from "./service/TeamService";
import { PlayerService } from "./service/PlayerService";
import { GameService } from "./modules/games/GameService";
import { GameStatsService } from "./service/GameStatsService";
import { GameEventRepository } from "./repository/GameEventRepository";
import { GameAssignmentService } from "./modules/games/GameAssignmentService";
import { GameAnalysisService } from "./modules/games/GameAnalysisService";
import { VideoAnalysisResultService } from "./service/VideoAnalysisResultService";
import { IEventBus } from "./core/interfaces/IEventBus";

// Extend the Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: { uid: string; email: string | null; };
        }
    }
}

const app = express();
app.use(cors({ origin: (origin, callback) => callback(null, origin), credentials: true }));
app.use(express.json());
app.use(loggingMiddleware);

// Serve uploaded videos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger definition (kept here for simplicity, can be moved to config)
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'StatVision API',
            version: '1.0.0',
            description: 'API documentation for the StatVision backend application',
        },
        servers: [{ url: 'http://localhost:3000', description: 'Development server' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/*.ts', './src/routes/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let authProvider: IAuthProvider;

AppDataSource.initialize()
    .then(() => {
        logger.info("Data Source has been initialized!");

        const container = AppContainer.getInstance(AppDataSource);

        const jwksUri = process.env.AUTH0_JWKS_URI!;
        const audience = process.env.AUTH0_AUDIENCE!;
        const issuer = process.env.AUTH0_ISSUER!;

        authProvider = getAuthProvider(jwksUri, audience, issuer);

        // Initialize background consumers
        container.get<VideoAnalysisResultService>(VideoAnalysisResultService).startConsumingResults();

        // Apply authMiddleware globally
        app.use(authMiddleware(AppDataSource, authProvider));

        // Routes
        app.use("/", authRoutes(AppDataSource));
        app.use("/teams", teamRoutes(AppDataSource, container.get(TeamService)));
        app.use("/teams/:teamId/players", playerRoutes(AppDataSource, container.get(TeamService), container.get(PlayerService)));
        app.use("/players", playerGlobalRoutes(AppDataSource, container.get(PlayerService)));
        
        app.use("/games", gameRoutes(
            AppDataSource, 
            container.get(GameService), 
            container.get(GameStatsService), 
            container.get(GameEventRepository),
            container.get(GameAssignmentService),
            container.get(GameAnalysisService),
            container.get<IEventBus>("IEventBus")
        ));

        // Error handling middleware should be LAST
        app.use(errorMiddleware);

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    })
    .catch((err: any) => {
        logger.error("Error during Data Source initialization:", err);
    });
