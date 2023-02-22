import { IUserTokenRepository } from '../src';

export const newUserTokenRepositoryMock = (): jest.Mocked<IUserTokenRepository> => {
  return {
    create: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
  };
};
