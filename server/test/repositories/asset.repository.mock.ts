import { IAssetRepository } from '@app/domain';

export const newAssetRepositoryMock = (): jest.Mocked<IAssetRepository> => {
  return {
    getByDate: jest.fn(),
    getByIds: jest.fn().mockResolvedValue([]),
    getByAlbumId: jest.fn(),
    getByUserId: jest.fn(),
    getWithout: jest.fn(),
    getWith: jest.fn(),
    getFirstAssetForAlbumId: jest.fn(),
    getLastUpdatedAssetForAlbumId: jest.fn(),
    getAll: jest.fn().mockResolvedValue({ items: [], hasNextPage: false }),
    updateAll: jest.fn(),
    deleteAll: jest.fn(),
    save: jest.fn(),
    findLivePhotoMatch: jest.fn(),
    getMapMarkers: jest.fn(),
    getStatistics: jest.fn(),
    getByTimeBucket: jest.fn(),
    getTimeBuckets: jest.fn(),
  };
};
