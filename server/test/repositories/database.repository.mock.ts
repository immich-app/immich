import { DatabaseRepository } from 'src/repositories/database.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newDatabaseRepositoryMock = (): Mocked<RepositoryInterface<DatabaseRepository>> => {
  return {
    shutdown: vitest.fn(),
    getExtensionVersions: vitest.fn(),
    getVectorExtension: vitest.fn(),
    getExtensionVersionRange: vitest.fn(),
    getPostgresVersion: vitest.fn().mockResolvedValue('14.10 (Debian 14.10-1.pgdg120+1)'),
    getPostgresVersionRange: vitest.fn().mockReturnValue('>=14.0.0'),
    createExtension: vitest.fn().mockResolvedValue(void 0),
    dropExtension: vitest.fn(),
    updateVectorExtension: vitest.fn(),
    reindexVectorsIfNeeded: vitest.fn(),
    getDimensionSize: vitest.fn(),
    setDimensionSize: vitest.fn(),
    deleteAllSearchEmbeddings: vitest.fn(),
    prewarm: vitest.fn(),
    runMigrations: vitest.fn(),
    withLock: vitest.fn().mockImplementation((_, function_: <R>() => Promise<R>) => function_()),
    tryLock: vitest.fn(),
    isBusy: vitest.fn(),
    wait: vitest.fn(),
  };
};
