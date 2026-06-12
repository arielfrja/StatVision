import axios from 'axios';

// Get current user from localStorage if available (Auth0 often stores minimal info here)
const getClientContext = () => {
    if (typeof window === 'undefined') return {};
    return {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
    };
};

/**
 * Sends logs from the frontend to the centralized API logging endpoint.
 */
export const logToBackend = async (
    level: 'info' | 'warn' | 'error' | 'debug', 
    message: string, 
    errorData?: any
) => {
    if (typeof window === 'undefined') return;

    // Avoid infinite loops if the logging endpoint itself fails
    if (window.location.pathname === '/api/log') return;

    const context = getClientContext();
    const payload = {
        level,
        url: context.url,
        timestamp: context.timestamp,
        userAgent: context.userAgent,
        ...(errorData instanceof Error 
            ? { stack: errorData.stack, message: errorData.message || message } 
            : { message, meta: errorData })
    };

    try {
        // Use a relative path so it works across different environments/domains
        // Note: In Next.js with rewrites, this will hit our API
        await axios.post('/api/log', payload, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        // Fallback to console if remote logging fails
        console.warn('[Logger] Failed to send log to API:', err);
    }
};

/**
 * Initializes global error listeners to capture uncaught exceptions and rejections.
 */
export const initGlobalErrorLogging = () => {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
        logToBackend('error', `Uncaught Exception: ${event.message}`, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        logToBackend('error', `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`, {
            reason: event.reason,
            stack: event.reason?.stack
        });
    });

    console.info('[Logger] Global error listeners initialized.');
};
