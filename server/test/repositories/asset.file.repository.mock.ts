import { AssetFileRepository } from 'src/repositories/asset-file.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newAssetFileRepositoryMock = (): Mocked<RepositoryInterface<AssetFileRepository>> => {
  return {
    createAll: vitest.fn(),
    getAll: vitest.fn().mockResolvedValue({ items: [], hasNextPage: false }),
    getById: vitest.fn(),
    update: vitest.fn(),
    upsert: vitest.fn(),
    upsertAll: vitest.fn(),
    getAssetSidecarsByPath: vitest.fn(),
    filterSidecarPaths: vitest.fn(),
  };
};
