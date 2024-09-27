import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { Mocked, vitest } from 'vitest';

export const newLoggerRepositoryMock = (): Mocked<ILoggerRepository> => {
  return {
    setLogLevel: vitest.fn(),
    setContext: vitest.fn(),
    setAppName: vitest.fn(),
    isLevelEnabled: vitest.fn(),
    verbose: vitest.fn(),
    debug: vitest.fn(),
    log: vitest.fn(),
    warn: vitest.fn(),
    error: vitest.fn(),
    fatal: vitest.fn(),
  };
};
