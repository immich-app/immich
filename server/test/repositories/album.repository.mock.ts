import { AlbumRepository } from 'src/repositories/album.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newAlbumRepositoryMock = (): Mocked<RepositoryInterface<AlbumRepository>> => {
  return {
    getById: vitest.fn(),
    getByAssetId: vitest.fn(),
    getMetadataForIds: vitest.fn(),
    getOwned: vitest.fn(),
    getShared: vitest.fn(),
    getNotShared: vitest.fn(),
    restoreAll: vitest.fn(),
    softDeleteAll: vitest.fn(),
    deleteAll: vitest.fn(),
    addAssetIds: vitest.fn(),
    removeAsset: vitest.fn(),
    removeAssetIds: vitest.fn(),
    getAssetIds: vitest.fn(),
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    updateThumbnails: vitest.fn(),
  };
};
