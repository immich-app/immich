import { VersionHistoryRepository } from 'src/repositories/version-history.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newVersionHistoryRepositoryMock = (): Mocked<RepositoryInterface<VersionHistoryRepository>> => {
  return {
    getAll: vitest.fn().mockResolvedValue([]),
    getLatest: vitest.fn(),
    create: vitest.fn(),
  };
};
