import { ILoggingRepository } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newLoggingRepositoryMock = (): Mocked<ILoggingRepository> => {
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
