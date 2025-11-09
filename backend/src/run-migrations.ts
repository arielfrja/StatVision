import "reflect-metadata";
import { AppDataSource } from "./data-source";
import logger from "./config/logger";

const runMigrations = async () => {
    try {
        logger.info("Initializing data source for migration...");
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        logger.info("Data source initialized. Running migrations...");
        await AppDataSource.runMigrations();
        logger.info("Migrations have been successfully run.");
    } catch (error) {
        logger.error("Error running migrations:", error);
        process.exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            logger.info("Data source connection closed after migration.");
        }
    }
};

runMigrations();
