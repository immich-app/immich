import { IUserRepository } from '../src';

export const newUserRepositoryMock = (): jest.Mocked<IUserRepository> => {
  return {
    get: jest.fn(),
    getAdmin: jest.fn(),
    getByEmail: jest.fn(),
    getByOAuthId: jest.fn(),
    getList: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getDeletedUsers: jest.fn(),
    restore: jest.fn(),
  };
};
