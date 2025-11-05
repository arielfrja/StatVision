import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
// Keep debug for file, but console will be info or higher
const fileLogLevel = isProduction ? 'info' : 'debug';
const consoleLogLevel = isProduction ? 'info' : 'info'; // Only info and above to console in dev too

const logger = winston.createLogger({
  level: fileLogLevel, // Default level for all transports unless overridden
  format: winston.format.json(), // JSON format for file logs
  transports: [
    new winston.transports.Console({
      level: consoleLogLevel, // Override console level
      format: winston.format.combine(
        winston.format.colorize(), // Add color for console readability
        winston.format.simple()
      ),
    }),
  ],
});

// Add file transports for all environments, or conditionally if preferred
// For now, let's ensure file logging is always active for detailed logs
logger.add(
  new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    format: winston.format.json(),
  })
);
logger.add(
  new winston.transports.File({
    filename: 'combined.log',
    level: fileLogLevel, // Capture debug in dev, info in prod
    format: winston.format.json(),
  })
);

export default logger;