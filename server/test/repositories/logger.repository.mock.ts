import { ILoggerRepository } from 'src/interfaces/logger.interface';

export const newLoggerRepositoryMock = (): jest.Mocked<ILoggerRepository> => {
  return {
    setLogLevel: jest.fn(),
    setContext: jest.fn(),

    verbose: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  };
};
