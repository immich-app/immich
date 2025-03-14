import { LoggingRepository } from 'src/repositories/logging.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newLoggingRepositoryMock = (): Mocked<RepositoryInterface<LoggingRepository>> => {
  return {
    setLogLevel: vitest.fn(),
    setContext: vitest.fn(),
    setAppName: vitest.fn(),
    isLevelEnabled: vitest.fn(),
    verbose: vitest.fn(),
    verboseFn: vitest.fn(),
    debug: vitest.fn(),
    debugFn: vitest.fn(),
    log: vitest.fn(),
    warn: vitest.fn(),
    error: vitest.fn(),
    fatal: vitest.fn(),
  };
};

export const newFakeLoggingRepository = () =>
  newLoggingRepositoryMock() as RepositoryInterface<LoggingRepository> as LoggingRepository;
