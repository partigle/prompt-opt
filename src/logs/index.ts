export { Logger, LogEntry, LogStats } from './logger.js';
import Logger from './logger.js';

// Singleton instance
let logger: Logger | null = null;

export function getLogger(): Logger {
  if (!logger) {
    logger = new Logger();
  }
  return logger;
}

export function createLogger(logDir?: string): Logger {
  return new Logger(logDir);
}
