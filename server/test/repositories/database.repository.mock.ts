import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { Mocked, vitest } from 'vitest';

export const newDatabaseRepositoryMock = (): Mocked<IDatabaseRepository> => {
  return {
    reconnect: vitest.fn(),
    getExtensionVersion: vitest.fn(),
    getExtensionVersionRange: vitest.fn(),
    getPostgresVersion: vitest.fn().mockResolvedValue('14.10 (Debian 14.10-1.pgdg120+1)'),
    getPostgresVersionRange: vitest.fn().mockReturnValue('>=14.0.0'),
    createExtension: vitest.fn().mockResolvedValue(void 0),
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
