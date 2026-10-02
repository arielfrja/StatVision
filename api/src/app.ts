import dotenv from 'dotenv';
import path from 'path';
import { JobWatchdogService } from "./service/JobWatchdogService";
import logger from "./config/logger";

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

import "reflect-metadata";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./data-source";
import { authMiddleware } from "./middleware/authMiddleware";
import { IAuthProvider } from "./auth/authProvider";
import { getAuthProvider } from "./auth/authProviderFactory";
import { authRoutes } from "./routes/authRoutes";
import { teamRoutes } from "./routes/teamRoutes";
import { playerGlobalRoutes } from "./routes/playerGlobalRoutes";
import { gameRoutes } from "./routes/gameRoutes";
import { usageRoutes } from "./routes/usageRoutes";
import { webhookRoutes } from "./routes/webhookRoutes";
import loggingMiddleware from './middleware/loggingMiddleware';
import errorMiddleware from './middleware/errorMiddleware';
import { AppContainer } from "./shared/AppContainer";
import { TeamService, PlayerService, GameStatsService, GameEventRepository, IEventBus, IStorageProvider, AiUsageService } from "@statvision/common";
import { GameService } from "./modules/games/GameService";
import { GameAssignmentService } from "./modules/games/GameAssignmentService";
import { GameAnalysisService } from "./modules/games/GameAnalysisService";
import { VideoAnalysisResultService } from "./service/VideoAnalysisResultService";
import { ProgressSubscriberService } from "./service/ProgressSubscriberService";
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

import logRoutes from './routes/logRoutes';

const app = express();
app.disable('x-powered-by');

// Security headers
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

// CORS — allowlist from env CORS_ORIGINS (comma-separated), or localhost fallback
// DO NOT use origin: '*' with credentials: true (CORS spec violation)
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3001', 'http://localhost:3002'];
app.use(cors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-goog-resumable"]
}));
app.use(express.json());
// Malformed JSON -> 400 JSON (not HTML/500). Must be 4-arg error handler right after express.json().
app.use((err: any, _req: any, res: any, next: any) => {
    if ((err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) || err?.type === 'entity.parse.failed') {
        return res.status(400).json({ status: 'error', message: 'Invalid JSON payload.' });
    }
    next(err);
});
app.use(loggingMiddleware);

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: false,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Public route for client logs (must be before auth)
app.use("/api/log", logRoutes);

// Register Webhooks BEFORE global auth middleware
app.use("/api/webhooks", webhookRoutes);

const swaggerSpec = swaggerJsdoc(swaggerOptions);
// NOTE (A4): /api-docs is intentionally public (before authMiddleware) for local/dev discovery.
// Do NOT move behind auth without updating frontend docs + CI smoke tests that fetch /api-docs without a token.
// Production hardening option: gate via env flag, not by default (keeps existing behavior).
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

        /**
         * PRODUCTION ARCHITECTURE (PUSH-BASED)
         * 1. We NO LONGER call startConsumingResults() here.
         * 2. We NO LONGER initialize Socket.io.
         * 3. We NO LONGER use setInterval for the Watchdog.
         * 
         * Everything is triggered via /api/webhooks/
         */
        
        // Legacy fallback for local development (only if manually enabled)
        if (process.env.ENABLE_LEGACY_PULL === 'true') {
            container.get<VideoAnalysisResultService>(VideoAnalysisResultService).startConsumingResults();
            container.get<ProgressSubscriberService>(ProgressSubscriberService).startSubscribing();
        }

        // Public Routes (No Auth) — /api/log already registered above
        // All three routes below (/protected, /me, /me/preferences) require a
        // verified identity: authRoutes reads req.user, which only exists
        // AFTER authMiddleware runs. Mounting it before the middleware left
        // req.user unset and every call 401'd (M-2). Gate the mount itself.
        app.use("/", authMiddleware(AppDataSource, authProvider), authRoutes(AppDataSource));
        app.use("/api/webhooks", webhookRoutes);

        // Apply authMiddleware to everything below
        app.use(authMiddleware(AppDataSource, authProvider));

        // Protected Routes
        app.use("/teams", teamRoutes(AppDataSource, container.get(TeamService), container.get(PlayerService)));
        app.use("/players", playerGlobalRoutes(AppDataSource, container.get(PlayerService), container.get(GameStatsService)));
        
        // A4: GET /games/count would otherwise match GET /:gameId with gameId="count"
        // inside gameRoutes (which we must NOT touch) and bubble a 500 on invalid-UUID lookup.
        // Register BEFORE app.use("/games") so Express matches this first and returns honest 404 JSON.
        app.get("/games/count", (req, res) => {
            if (!(req as any).user?.id) return res.status(401).json({ message: "Unauthorized" });
            return res.status(404).json({ status: 'error', message: 'Game not found.' });
        });

        app.use("/games", gameRoutes(
            AppDataSource, 
            container.get(GameService), 
            container.get(GameStatsService), 
            container.get(GameEventRepository),
            container.get(GameAssignmentService),
            container.get(GameAnalysisService),
            container.get<IEventBus>("IEventBus"),
            container.get<IStorageProvider>("IStorageProvider")
        ));
        app.use("/usage", usageRoutes(container.get(AiUsageService)));

        // A4: Unknown API sub-routes -> JSON 404 (not Express default HTML).
        // Covers /teams/*, /players/*, /games/*, /usage/* typos and stale frontend links.
        app.use((req, res) => {
            return res.status(404).json({ status: 'error', message: `Not found: ${req.method} ${req.originalUrl}` });
        });

        // Error handling middleware should be LAST
        app.use(errorMiddleware);

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT} (PURE STATELESS MODE)`);
        });
    })
    .catch((err: any) => {
        logger.error("Error during Data Source initialization:", err);
    });

export default app;
