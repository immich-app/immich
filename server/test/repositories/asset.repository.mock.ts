import { IAssetRepository } from '@app/domain';

export const newAssetRepositoryMock = (): jest.Mocked<IAssetRepository> => {
  return {
    getByDate: jest.fn(),
    getByIds: jest.fn().mockResolvedValue([]),
    getWithout: jest.fn(),
    getWith: jest.fn(),
    getFirstAssetForAlbumId: jest.fn(),
    getAll: jest.fn().mockResolvedValue({
      items: [],
      hasNextPage: false,
    }),
    deleteAll: jest.fn(),
    save: jest.fn(),
    findLivePhotoMatch: jest.fn(),
    getMapMarkers: jest.fn(),
  };
};
