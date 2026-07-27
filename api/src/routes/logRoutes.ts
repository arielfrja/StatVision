import { Router } from 'express';
import logger from '../config/logger';

const router = Router();

/**
 * Public endpoint for receiving logs from the client.
 * Intentionally unauthenticated so errors can be reported even for auth failures.
 * Input is sanitized to prevent injection attacks.
 */
router.post('/', (req, res) => {
    // Validate Content-Type
    if (!req.is('application/json')) {
        return res.status(400).json({ error: 'Content-Type must be application/json' });
    }

    // Ensure body is a valid object
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Request body must be a JSON object' });
    }

    const { level, message, stack, url, user, timestamp, ...meta } = req.body;

    // Sanitize — limit length, strip control chars, prevent injection
    const sanitize = (val: unknown, maxLen = 1000): string =>
        typeof val === 'string'
            ? val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, maxLen)
            : '';

    const sanitizedMessage = sanitize(message, 2000);
    const sanitizedUrl = sanitize(url, 500);
    const sanitizedLevel = sanitize(level, 50).toLowerCase();

    // Whitelist allowed log levels
    const allowedLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
    const finalLevel = allowedLevels.includes(sanitizedLevel) ? sanitizedLevel : 'info';

    const logMessage = `[CLIENT][${sanitizedUrl || 'unknown'}] ${sanitizedMessage}`;
    const logData: Record<string, unknown> = {
        client_stack: sanitize(stack, 5000),
        client_timestamp: sanitize(timestamp, 100),
        is_client_log: true,
    };

    // Prevent prototype pollution — only copy safe keys from meta
    const safeKeys = ['userAgent', 'referrer', 'locale', 'device', 'os', 'browser', 'version'];
    for (const key of safeKeys) {
        const val = meta[key];
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            logData[key] = val;
        }
    }

    switch (finalLevel) {
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
