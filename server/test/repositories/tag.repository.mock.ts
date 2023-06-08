import { ITagRepository } from '@app/domain';

export const newTagRepositoryMock = (): jest.Mocked<ITagRepository> => {
  return {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    hasAsset: jest.fn(),
    hasName: jest.fn(),
    getAssets: jest.fn(),
    addAssets: jest.fn(),
    removeAssets: jest.fn(),
  };
};
