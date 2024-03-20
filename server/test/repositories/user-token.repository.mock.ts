import { IUserTokenRepository } from 'src/interfaces/user-token.repository';

export const newUserTokenRepositoryMock = (): jest.Mocked<IUserTokenRepository> => {
  return {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    getByToken: jest.fn(),
    getAll: jest.fn(),
  };
};
