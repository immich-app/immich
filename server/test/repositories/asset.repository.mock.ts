import { IAssetRepository } from '@app/domain';

export const newAssetRepositoryMock = (): jest.Mocked<IAssetRepository> => {
  return {
    create: jest.fn(),
    getByDate: jest.fn(),
    getByIds: jest.fn().mockResolvedValue([]),
    getByAlbumId: jest.fn(),
    getByUserId: jest.fn(),
    getWithout: jest.fn(),
    getWith: jest.fn(),
    getFirstAssetForAlbumId: jest.fn(),
    getLastUpdatedAssetForAlbumId: jest.fn(),
    getByLibraryId: jest.fn(),
    getById: jest.fn(),
    getByLibraryIdAndOriginalPath: jest.fn(),
    getAll: jest.fn().mockResolvedValue({ items: [], hasNextPage: false }),
    deleteAll: jest.fn(),
    save: jest.fn(),
    findLivePhotoMatch: jest.fn(),
    getMapMarkers: jest.fn(),
    getStatistics: jest.fn(),
    getByTimeBucket: jest.fn(),
    getTimeBuckets: jest.fn(),
    remove: jest.fn(),
  };
};
