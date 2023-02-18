import { IAssetRepository } from '../src';

export const newAssetRepositoryMock = (): jest.Mocked<IAssetRepository> => {
  return {
    deleteAll: jest.fn(),
  };
};
