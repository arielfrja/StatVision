import * as winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
// Keep debug for file, but console will be info or higher
const fileLogLevel = isProduction ? 'info' : 'debug';
const consoleLogLevel = isProduction ? 'info' : 'info'; // Only info and above to console in dev too

const logDir = path.join(__dirname, '../../logs'); // backend/logs

const logger = winston.createLogger({
  level: fileLogLevel, // Default level for all transports unless overridden
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      level: consoleLogLevel, // Override console level
      format: winston.format.combine(
        winston.format.colorize(), // Add color for console readability
        winston.format.simple()
      ),
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: 'error-%DATE%.log',
      dirname: logDir,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'combined-%DATE%.log',
      dirname: logDir,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
});

export default logger;