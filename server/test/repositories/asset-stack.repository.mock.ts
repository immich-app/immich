import { IAssetStackRepository } from 'src/interfaces/asset-stack.interface';

export const newAssetStackRepositoryMock = (): jest.Mocked<IAssetStackRepository> => {
  return {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn(),
  };
};
