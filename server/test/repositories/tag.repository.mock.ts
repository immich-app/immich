import { TagRepository } from 'src/repositories/tag.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newTagRepositoryMock = (): Mocked<RepositoryInterface<TagRepository>> => {
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
