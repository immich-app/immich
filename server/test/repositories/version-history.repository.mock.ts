import { IVersionHistoryRepository } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newVersionHistoryRepositoryMock = (): Mocked<IVersionHistoryRepository> => {
  return {
    getAll: vitest.fn().mockResolvedValue([]),
    getLatest: vitest.fn(),
    create: vitest.fn(),
  };
};
