import { IAssetStackRepository } from 'src/interfaces/asset-stack.interface';
import { Mocked, vitest } from 'vitest';

export const newAssetStackRepositoryMock = (): Mocked<IAssetStackRepository> => {
  return {
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getById: vitest.fn(),
  };
};
