import { ISharedLinkRepository } from '../src';

export const newSharedLinkRepositoryMock = (): jest.Mocked<ISharedLinkRepository> => {
  return {
    get: jest.fn(),
    getById: jest.fn(),
    getByIdAndUserId: jest.fn(),
    getByKey: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
    hasAssetAccess: jest.fn(),
  };
};
