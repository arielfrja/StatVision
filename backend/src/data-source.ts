import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "statsvision",
    password: process.env.DB_PASSWORD || "statsvision_password",
    database: process.env.DB_DATABASE || "statsvision_db",
    synchronize: false, // Set to false for production and rely on migrations
    logging: true,
    entities: [
        "src/User.ts",
        "src/Team.ts",
        "src/Player.ts",
        "src/PlayerTeamHistory.ts",
        "src/Game.ts",
        "src/GameEvent.ts",
        "src/GameTeamStats.ts",
        "src/GamePlayerStats.ts",
        "src/worker/VideoAnalysisJob.ts",
        "src/worker/Chunk.ts"
    ],
    migrations: ["src/migration/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"],
    migrationsTableName: "migrations"
});
