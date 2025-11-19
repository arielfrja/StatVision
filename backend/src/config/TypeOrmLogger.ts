import { Logger, QueryRunner } from "typeorm";
import { jobLogger } from "./loggers";

/**
 * Custom TypeORM logger that provides summarized query output.
 * It logs a brief message for each query execution and detailed information for errors or slow queries.
 */
export class TypeOrmLogger implements Logger {
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        // Log a truncated version of the query for brevity
        jobLogger.info(`[DATABASE] Executing query: ${query.substring(0, 100)}...`, { phase: 'database' });
    }

    logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        jobLogger.error("[DATABASE] Query failed.", { 
            error: error.toString(), 
            query, 
            parameters,
            phase: 'database'
        });
    }

    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        jobLogger.warn(`[DATABASE] Slow query detected (${time}ms).`, { 
            query, 
            parameters,
            phase: 'database'
        });
    }

    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        jobLogger.info(`[DATABASE] Schema build: ${message}`, { phase: 'database' });
    }

    logMigration(message: string, queryRunner?: QueryRunner) {
        jobLogger.info(`[DATABASE] Migration: ${message}`, { phase: 'database' });
    }

    log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner) {
        switch (level) {
            case "info":
                jobLogger.info(`[DATABASE] ${message}`, { phase: 'database' });
                break;
            case "warn":
                jobLogger.warn(`[DATABASE] ${message}`, { phase: 'database' });
                break;
            case "log":
            default:
                jobLogger.info(`[DATABASE] ${message}`, { phase: 'database' });
                break;
        }
    }
}
