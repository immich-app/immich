import { ISharedLinkRepository } from '@app/domain';

export const newSharedLinkRepositoryMock = (): jest.Mocked<ISharedLinkRepository> => {
  return {
    getAll: jest.fn(),
    get: jest.fn(),
    getByKey: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };
};
