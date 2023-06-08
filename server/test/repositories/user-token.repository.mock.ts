import { IUserTokenRepository } from '@app/domain';

export const newUserTokenRepositoryMock = (): jest.Mocked<IUserTokenRepository> => {
  return {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    getByToken: jest.fn(),
    getAll: jest.fn(),
  };
};
