import { LogLevel } from '@nestjs/common';

export * from './time-utils';
export * from './asset-utils';

export function getLogLevels() {
  const LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error'];
  let logLevel = process.env.LOG_LEVEL || 'log';
  if (logLevel === 'simple') {
    logLevel = 'log';
  }
  const logLevelIndex = LOG_LEVELS.indexOf(logLevel as LogLevel);
  return logLevelIndex === -1 ? [] : LOG_LEVELS.slice(logLevelIndex);
}
