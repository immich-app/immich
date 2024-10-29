import { ITagRepository } from 'src/interfaces/tag.interface';
import { Mocked, vitest } from 'vitest';

export const newTagRepositoryMock = (): Mocked<ITagRepository> => {
  return {
    getAll: vitest.fn(),
    getByValue: vitest.fn(),
    upsertValue: vitest.fn(),
    upsertAssetTags: vitest.fn(),

    get: vitest.fn(),
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),

    getAssetIds: vitest.fn(),
    addAssetIds: vitest.fn(),
    removeAssetIds: vitest.fn(),
    upsertAssetIds: vitest.fn(),
    deleteEmptyTags: vitest.fn(),
  };
};
