import { ITagRepository } from 'src/interfaces/tag.interface';
import { Mocked, vitest } from 'vitest';

export const newTagRepositoryMock = (): Mocked<ITagRepository> => {
  return {
    getAll: vitest.fn(),
    getById: vitest.fn(),
    create: vitest.fn(),
    update: vitest.fn(),
    remove: vitest.fn(),
    hasAsset: vitest.fn(),
    hasName: vitest.fn(),
    getAssets: vitest.fn(),
    addAssets: vitest.fn(),
    removeAssets: vitest.fn(),
  };
};
