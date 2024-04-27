import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { Version } from 'src/utils/version';
import { Mocked, vitest } from 'vitest';

export const newDatabaseRepositoryMock = (): Mocked<IDatabaseRepository> => {
  return {
    getExtensionVersion: vitest.fn(),
    getAvailableExtensionVersion: vitest.fn(),
    getPreferredVectorExtension: vitest.fn(),
    getPostgresVersion: vitest.fn().mockResolvedValue(new Version(14, 0, 0)),
    createExtension: vitest.fn().mockImplementation(() => Promise.resolve()),
    updateExtension: vitest.fn(),
    updateVectorExtension: vitest.fn(),
    reindex: vitest.fn(),
    shouldReindex: vitest.fn(),
    runMigrations: vitest.fn(),
    withLock: vitest.fn().mockImplementation((_, function_: <R>() => Promise<R>) => function_()),
    tryLock: vitest.fn(),
    isBusy: vitest.fn(),
    wait: vitest.fn(),
  };
};
