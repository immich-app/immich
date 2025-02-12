import { MemoryRepository } from 'src/repositories/memory.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newMemoryRepositoryMock = (): Mocked<RepositoryInterface<MemoryRepository>> => {
  return {
    search: vitest.fn().mockResolvedValue([]),
    get: vitest.fn(),
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getAssetIds: vitest.fn().mockResolvedValue(new Set()),
    addAssetIds: vitest.fn(),
    removeAssetIds: vitest.fn(),
  };
};
