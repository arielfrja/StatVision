import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { Player } from "./Player";
import { Game } from "./Game";
import { GameEvent } from "./GameEvent";
import { TeamRepository } from "./repository/TeamRepository";
import { TeamService } from "./service/TeamService";
import { PlayerRepository } from "./repository/PlayerRepository";
import { PlayerService } from "./service/PlayerService";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { Auth0Provider } from "./auth/auth0Provider";
import { authRoutes } from "./routes/authRoutes";
import { teamRoutes } from "./routes/teamRoutes";
import { playerRoutes } from "./routes/playerRoutes";

// Extend the Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: { uid: string; email: string; }; // Generic user info
        }
    }
}

// Instantiate the Auth0 provider
const authProvider = new Auth0Provider();

// Define the authMiddleware function
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Allow /register and /api-docs to bypass authentication
    if (req.path === "/register" || req.path.startsWith("/api-docs")) {
        return next();
    }

    // Use the selected authentication provider to verify the token
    await authProvider.verifyToken(req, res, next);
};

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "statsvision",
    password: "statsvision",
    database: "statsvision_db",
    synchronize: true, // Use migrations in production
    logging: false,
    entities: [User, Team, Player, Game, GameEvent],
    subscribers: [],
    migrations: [],
});

const app = express();
app.use(cors({ origin: 'http://localhost:3001' }));
app.use(express.json()); // Enable JSON body parser

import loggingMiddleware from './middleware/loggingMiddleware';
import errorMiddleware from './middleware/errorMiddleware';

// Log all incoming requests
app.use(loggingMiddleware);

// Apply authMiddleware globally
app.use(authMiddleware);

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

// Initialize Data Source and start the server
import logger from "./config/logger";

// ... (keep the existing code until the next change)

AppDataSource.initialize()
    .then(() => {
        logger.info("Data Source has been initialized!");

        // Import and use routes
        app.use("/", authRoutes(AppDataSource));
        app.use("/teams", teamRoutes(AppDataSource));
        app.use("/teams/:teamId/players", playerRoutes(AppDataSource));

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error("Error during Data Source initialization:", err);
    });
