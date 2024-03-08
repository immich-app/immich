import { IUserRepository, UserCore } from '@app/domain';

export const newUserRepositoryMock = (reset = true): jest.Mocked<IUserRepository> => {
  if (reset) {
    UserCore.reset();
  }

  return {
    get: jest.fn(),
    getAdmin: jest.fn(),
    getByEmail: jest.fn(),
    getByStorageLabel: jest.fn(),
    getByOAuthId: jest.fn(),
    getUserStats: jest.fn(),
    getList: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getDeletedUsers: jest.fn(),
    hasAdmin: jest.fn(),
    updateUsage: jest.fn(),
    syncUsage: jest.fn(),
  };
};
