import { IDatabaseRepository, Version } from '@app/domain';
import { Mocked } from 'vitest';

export const newDatabaseRepositoryMock = (): Mocked<IDatabaseRepository> => {
  return {
    getExtensionVersion: vi.fn(),
    getAvailableExtensionVersion: vi.fn(),
    getPreferredVectorExtension: vi.fn(),
    getPostgresVersion: vi.fn().mockResolvedValue(new Version(14, 0, 0)),
    createExtension: vi.fn().mockImplementation(() => Promise.resolve()),
    updateExtension: vi.fn(),
    updateVectorExtension: vi.fn(),
    reindex: vi.fn(),
    shouldReindex: vi.fn(),
    runMigrations: vi.fn(),
    withLock: vi.fn().mockImplementation((_, function_: <R>() => Promise<R>) => function_()),
    tryLock: vi.fn(),
    isBusy: vi.fn(),
    wait: vi.fn(),
  };
};
