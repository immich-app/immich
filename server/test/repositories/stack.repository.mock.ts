import { IStackRepository } from 'src/interfaces/stack.interface';
import { Mocked, vitest } from 'vitest';

export const newAssetStackRepositoryMock = (): Mocked<IStackRepository> => {
  return {
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    deleteAll: vitest.fn(),
    deleteByUserId: vitest.fn(),
    getById: vitest.fn(),
    updatePrimaryAssets: vitest.fn(),
    addAssetIds: vitest.fn(),
    getAssetIds: vitest.fn(),
    removeAssetIds: vitest.fn(),
  };
};
