import winston from 'winston';
import path from 'path';
import 'winston-daily-rotate-file';

const projectRoot = path.resolve(__dirname, '../../../'); // From backend/src/config -> StatVision

// Custom formatter to adjust file paths in development
const devPathFormatter = winston.format((info) => {
    if (process.env.NODE_ENV !== 'production') {
        // Use a regex to replace all occurrences of the absolute path
        const regex = new RegExp(projectRoot.replace(/([.*+?^=!:${}()|[\]\/])/g, "\\$1"), 'g');
        if (info.message && typeof info.message === 'string') {
            info.message = info.message.replace(regex, 'StatVision');
        }
        if (info.stack && typeof info.stack === 'string') {
            info.stack = info.stack.replace(regex, 'StatVision');
        }
    }
    return info;
});

const createLogger = (logBaseName: string) => {
    const transport = new winston.transports.DailyRotateFile({
        filename: `${logBaseName}-%DATE%.log`,
        dirname: path.join(__dirname, '../../logs'), // backend/logs/
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
    });

    const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            devPathFormatter(),
            winston.format.printf(({ timestamp, level, message, stack, phase }) => {
                const phaseStr = phase ? `[${String(phase).toUpperCase()}]` : '';
                if (stack) {
                    return `${timestamp} [${level.toUpperCase()}]${phaseStr} ${message}\n${stack}`;
                }
                return `${timestamp} [${level.toUpperCase()}]${phaseStr} ${message}`;
            })
        ),
        transports: [
            transport
        ]
    });

        if (process.env.NODE_ENV !== 'production' && process.env.CONSOLE_LOGGING !== 'true') {

            // Console transport removed for minimal output

        } else if (process.env.NODE_ENV !== 'production') {

            logger.add(new winston.transports.Console({

                format: winston.format.combine(

                    winston.format.colorize(),

                    winston.format.printf(({ timestamp, level, message, stack, phase }) => {

                        const phaseStr = phase ? `[${String(phase).toUpperCase()}]` : '';

                        if (stack) {

                            return `${timestamp} [${level.toUpperCase()}]${phaseStr} ${message}\n${stack}`;

                        }

                        return `${timestamp} [${level.toUpperCase()}]${phaseStr} ${message}`;

                    })

                )

            }));

        }

    return logger;
};

export const jobLogger = createLogger('worker-job');
export const chunkLogger = createLogger('worker-chunk');
