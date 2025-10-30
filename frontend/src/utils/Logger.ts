// frontend/src/utils/Logger.ts
import { logToBackend } from './logToBackend'; // Temporarily import, will be integrated

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  private formatMessage(message: string, metadata?: Record<string, any>): string {
    return metadata ? `${this.prefix}${message} ${JSON.stringify(metadata)}` : `${this.prefix}${message}`;
  }

  log(message: string, metadata?: Record<string, any>): void {
    console.log(this.formatMessage(message, metadata));
    logToBackend('log', `${this.prefix}${message}`, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    console.info(this.formatMessage(message, metadata));
    logToBackend('info', `${this.prefix}${message}`, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    console.warn(this.formatMessage(message, metadata));
    logToBackend('warn', `${this.prefix}${message}`, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    console.error(this.formatMessage(message, metadata));
    logToBackend('error', `${this.prefix}${message}`, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    console.debug(this.formatMessage(message, metadata));
    logToBackend('debug', `${this.prefix}${message}`, metadata);
  }
}

// Export a default instance for general use, or allow specific instances
export const appLogger = new Logger('App');
export default Logger;
