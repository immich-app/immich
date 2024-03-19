import { IUserTokenRepository } from 'src/domain/repositories/user-token.repository';

export const newUserTokenRepositoryMock = (): jest.Mocked<IUserTokenRepository> => {
  return {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    getByToken: jest.fn(),
    getAll: jest.fn(),
  };
};
