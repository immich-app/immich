import { IAssetRepository } from '../src';

export const newAssetRepositoryMock = (): jest.Mocked<IAssetRepository> => {
  return {
    getByIds: jest.fn(),
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
