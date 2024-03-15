import { IAlbumRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newAlbumRepositoryMock = (): Mocked<IAlbumRepository> => {
  return {
    getById: vi.fn(),
    getByIds: vi.fn(),
    getByAssetId: vi.fn(),
    getMetadataForIds: vi.fn(),
    getInvalidThumbnail: vi.fn(),
    getOwned: vi.fn(),
    getShared: vi.fn(),
    getNotShared: vi.fn(),
    restoreAll: vi.fn(),
    softDeleteAll: vi.fn(),
    deleteAll: vi.fn(),
    getAll: vi.fn(),
    addAssets: vi.fn(),
    removeAsset: vi.fn(),
    removeAssets: vi.fn(),
    getAssetIds: vi.fn(),
    hasAsset: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateThumbnails: vi.fn(),
  };
};
