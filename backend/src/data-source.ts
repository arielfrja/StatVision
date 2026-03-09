import "reflect-metadata";
import { DataSource } from "typeorm";
import { TypeOrmLogger } from "./config/TypeOrmLogger";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProduction = !!process.env.DATABASE_URL || !!process.env.DB_HOST;

console.log("DataSource: isProduction =", isProduction);
console.log("DataSource: DATABASE_URL =", process.env.DATABASE_URL ? "SET" : "NOT SET");

if (isProduction) {
    console.log(`Connecting to database at ${process.env.DB_HOST || 'URL'} as user ${process.env.DB_USERNAME || 'from URL'}`);
}

export const AppDataSource = new DataSource({
    type: "postgres",
    ...(process.env.DATABASE_URL ? {
        url: process.env.DATABASE_URL,
    } : {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME || "statsvision",
        password: process.env.DB_PASSWORD || "statsvision_password",
        database: process.env.DB_DATABASE || "statsvision_db",
    }),
    // Force these even if using URL to override driver defaults
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    synchronize: false, 
    logger: new TypeOrmLogger(),
    entities: [
        "src/core/entities/**/*.ts"
    ],
    migrations: ["src/migration/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"],
    migrationsTableName: "migrations",
    ssl: isProduction ? { rejectUnauthorized: false } : false
});
