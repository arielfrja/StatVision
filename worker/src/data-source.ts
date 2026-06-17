import "reflect-metadata";
import { DataSource } from "typeorm";
import { TypeOrmLogger } from "./config/TypeOrmLogger";
import dotenv from 'dotenv';
import path from 'path';
import * as Entities from "@statvision/common";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === "production";

console.log("DataSource: isProduction =", isProduction);
console.log("DataSource: DATABASE_URL =", process.env.DATABASE_URL ? "SET" : "NOT SET");

// Extract entities from the imported namespace
const entities = Object.values(Entities).filter(val => typeof val === 'function' && val.prototype && val.prototype.constructor);

export const AppDataSource = new DataSource({
    type: "postgres",
    ...(process.env.DATABASE_URL ? {
        url: process.env.DATABASE_URL,
    } : {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME || "statsvision",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || "statsvision_db",
    }),
    synchronize: false, 
    logger: new TypeOrmLogger(),
    entities: entities as any[],
    migrations: [
        path.join(__dirname, "../../common/src/migration/**/*.ts"),
        path.join(__dirname, "../node_modules/@statvision/common/build/migration/**/*.js")
    ],
    subscribers: ["src/subscriber/**/*.ts"],
    migrationsTableName: "migrations",
    ssl: isProduction ? { rejectUnauthorized: false } : false
});
