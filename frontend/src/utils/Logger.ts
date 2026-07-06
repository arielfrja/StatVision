// frontend/src/utils/Logger.ts
import { logToBackend } from './logToBackend';

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  private formatMessage(message: string): string {
    return `${this.prefix}${message}`;
  }

  // Helper to safely stringify metadata
  private safeStringify(data: any): string {
    try {
      return typeof data === 'object' ? JSON.stringify(data) : String(data);
    } catch {
      return '[Unstringifiable Data]';
    }
  }

  log(message: string, metadata?: any): void {
    console.log(this.formatMessage(message), metadata || '');
    logToBackend('info', this.formatMessage(message), metadata);
  }

  info(message: string, metadata?: any): void {
    console.info(this.formatMessage(message), metadata || '');
    logToBackend('info', this.formatMessage(message), metadata);
  }

  warn(message: string, metadata?: any): void {
    console.warn(this.formatMessage(message), metadata || '');
    logToBackend('warn', this.formatMessage(message), metadata);
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage(message), error || '');
    logToBackend('error', this.formatMessage(message), error);
  }

  debug(message: string, metadata?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(message), metadata || '');
    }
    // Only send debug logs to backend in development or if specifically needed
    if (process.env.NEXT_PUBLIC_REMOTE_DEBUG === 'true') {
        logToBackend('debug', this.formatMessage(message), metadata);
    }
  }
}

// Export a default instance for general use
export const appLogger = new Logger('App');
export default Logger;
