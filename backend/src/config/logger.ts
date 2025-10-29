import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = isProduction ? 'info' : 'debug'; // 'debug' for dev, 'info' for prod

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Add file transports only in non-production environments
if (!isProduction) {
  logger.add(
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  );
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

export default logger;