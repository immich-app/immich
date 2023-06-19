import { IAlbumRepository } from '@app/domain';

export const newAlbumRepositoryMock = (): jest.Mocked<IAlbumRepository> => {
  return {
    getByIds: jest.fn(),
    getByAssetId: jest.fn(),
    getAssetCountForIds: jest.fn(),
    getInvalidThumbnail: jest.fn(),
    getOwned: jest.fn(),
    getShared: jest.fn(),
    getNotShared: jest.fn(),
    deleteAll: jest.fn(),
    getAll: jest.fn(),
    hasAsset: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
};
