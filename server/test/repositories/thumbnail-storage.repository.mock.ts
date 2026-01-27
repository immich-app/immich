import { ThumbnailStorageRepository } from 'src/repositories/thumbnail-storage.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newThumbnailStorageRepositoryMock = (): Mocked<RepositoryInterface<ThumbnailStorageRepository>> => {
  return {
    initialize: vitest.fn(),
    isEnabled: vitest.fn().mockReturnValue(false),
    store: vitest.fn(),
    get: vitest.fn(),
    delete: vitest.fn(),
    deleteByAsset: vitest.fn(),
    close: vitest.fn(),
  };
};
