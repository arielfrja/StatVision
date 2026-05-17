import dotenv from 'dotenv';
import path from 'path';
import logger from "./config/logger";

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { authMiddleware } from "./middleware/authMiddleware";
import { IAuthProvider } from "./auth/authProvider";
import { getAuthProvider } from "./auth/authProviderFactory";
import { authRoutes } from "./routes/authRoutes";
import { teamRoutes } from "./routes/teamRoutes";
import { playerGlobalRoutes } from "./routes/playerGlobalRoutes";
import { gameRoutes } from "./routes/gameRoutes";
import loggingMiddleware from './middleware/loggingMiddleware';
import errorMiddleware from './middleware/errorMiddleware';
import { AppContainer } from "./shared/AppContainer";
import { TeamService, PlayerService, GameStatsService, GameEventRepository, IEventBus } from "@statvision/common";
import { GameService } from "./modules/games/GameService";
import { GameAssignmentService } from "./modules/games/GameAssignmentService";
import { GameAnalysisService } from "./modules/games/GameAnalysisService";
import { VideoAnalysisResultService } from "./service/VideoAnalysisResultService";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "./config/swagger";

// Extend the Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: { id?: string; uid: string; email: string | null; };
        }
    }
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let authProvider: IAuthProvider;

AppDataSource.initialize()
    .then(() => {
        logger.info("Data Source has been initialized!");

        const container = AppContainer.getInstance(AppDataSource);

        const jwksUri = process.env.AUTH0_JWKS_URI || "";
        const audience = process.env.AUTH0_AUDIENCE || "";
        const issuer = process.env.AUTH0_ISSUER || "";

        authProvider = getAuthProvider(jwksUri, audience, issuer);

        // Initialize background consumers
        container.get<VideoAnalysisResultService>(VideoAnalysisResultService).startConsumingResults();

        // Apply authMiddleware globally
        app.use(authMiddleware(AppDataSource, authProvider));

        // Routes
        app.use("/", authRoutes(AppDataSource));
        app.use("/teams", teamRoutes(AppDataSource, container.get(TeamService), container.get(PlayerService)));
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

export default app;
