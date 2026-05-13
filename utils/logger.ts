/**
 * Production-ready Logging Utility
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (this.isProduction) {
      // In production, we could send logs to an external service like Sentry, Logtail, or Datadog
      if (level === 'error') {
        console.error(formattedMessage, data || '');
        // Example: Sentry.captureException(data);
      } else if (level === 'warn') {
        console.warn(formattedMessage, data || '');
      } else {
        console.log(formattedMessage, data || '');
      }
    } else {
      // Local development logging
      switch (level) {
        case 'error':
          console.error(`\x1b[31m${formattedMessage}\x1b[0m`, data || '');
          break;
        case 'warn':
          console.warn(`\x1b[33m${formattedMessage}\x1b[0m`, data || '');
          break;
        case 'debug':
          console.debug(`\x1b[34m${formattedMessage}\x1b[0m`, data || '');
          break;
        default:
          console.log(`\x1b[32m${formattedMessage}\x1b[0m`, data || '');
      }
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  debug(message: string, data?: any) {
    if (!this.isProduction) {
      this.log('debug', message, data);
    }
  }
}

export const logger = new Logger();
