import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the backend directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

import "reflect-metadata";
import { PubSub } from "@google-cloud/pubsub";
import { DataSource } from "typeorm";
import { VideoProcessorWorker } from "./worker/videoProcessorWorker";
import { VideoAnalysisResultService } from "./service/VideoAnalysisResultService";
import * as winston from 'winston';
import { User } from "./User";

// Create a dedicated logger for the worker
const workerLogger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'worker.log', level: 'debug' }),
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
    ],
});
import { Team } from "./Team";
import { Player } from "././Player";
import { PlayerTeamHistory } from "./PlayerTeamHistory";
import { Game } from "./Game";
import { GameEvent } from "./GameEvent";
import { GameTeamStats } from "./GameTeamStats";
import { GamePlayerStats } from "./GamePlayerStats";
import { VideoAnalysisJob } from "./worker/VideoAnalysisJob";

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || "statvision",
    password: process.env.DB_PASSWORD || "statvision",
    database: process.env.DB_DATABASE || "statvision",
    synchronize: true, // Use migrations in production
    logging: false,
    entities: [User, Team, Player, PlayerTeamHistory, Game, GameEvent, GameTeamStats, GamePlayerStats, VideoAnalysisJob],
    migrations: [],
    subscribers: [],
});

AppDataSource.initialize()
    .then(() => {
        workerLogger.info("Data Source has been initialized!");
        const videoProcessorWorker = new VideoProcessorWorker(AppDataSource, workerLogger);
        videoProcessorWorker.startConsumingMessages();

        const videoAnalysisResultService = new VideoAnalysisResultService(AppDataSource, workerLogger);
        videoAnalysisResultService.startConsumingResults();
    })
    .catch((err) => {
        workerLogger.error("Error during Data Source initialization:", err);
    });
