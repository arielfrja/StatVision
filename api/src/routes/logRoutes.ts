import { Router } from 'express';
import logger from '../config/logger';

const router = Router();

/**
 * Endpoint for receiving logs from the client.
 * Allows tracking frontend errors, crashes, and performance issues centrally.
 */
router.post('/', (req, res) => {
    const { level, message, stack, url, user, timestamp, ...meta } = req.body;

    const logMessage = `[CLIENT][${url || 'unknown'}] ${message}`;
    const logData = {
        ...meta,
        client_stack: stack,
        client_user: user,
        client_timestamp: timestamp,
        is_client_log: true
    };

    // Use winston to log the data
    // Client logs are routed to client-YYYY-MM-DD.log by our custom transport
    switch (level?.toLowerCase()) {
        case 'error':
            logger.error(logMessage, logData);
            break;
        case 'warn':
            logger.warn(logMessage, logData);
            break;
        case 'debug':
            logger.debug(logMessage, logData);
            break;
        default:
            logger.info(logMessage, logData);
            break;
    }

    res.status(204).send();
});

export default router;
