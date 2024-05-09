import { IMemoryRepository } from 'src/interfaces/memory.interface';
import { Mocked, vitest } from 'vitest';

export const newMemoryRepositoryMock = (): Mocked<IMemoryRepository> => {
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
