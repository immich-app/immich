import { IUserTokenRepository } from '../src';

export const newUserTokenRepositoryMock = (): jest.Mocked<IUserTokenRepository> => {
  return {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    deleteAll: jest.fn(),
    getByToken: jest.fn(),
    getAll: jest.fn(),
  };
};
