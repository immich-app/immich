import { IAssetRepository } from '../src';

export const newAssetRepositoryMock = (): jest.Mocked<IAssetRepository> => {
  return {
    getByIds: jest.fn(),
    getWithout: jest.fn(),
    getFirstAssetForAlbumId: jest.fn(),
    getAll: jest.fn(),
    deleteAll: jest.fn(),
    save: jest.fn(),
    findLivePhotoMatch: jest.fn(),
  };
};
