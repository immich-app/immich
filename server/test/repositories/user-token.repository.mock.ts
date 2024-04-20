import { IUserTokenRepository } from 'src/interfaces/user-token.interface';
import { Mocked, vitest } from 'vitest';

export const newUserTokenRepositoryMock = (): Mocked<IUserTokenRepository> => {
  return {
    create: vitest.fn(),
    save: vitest.fn(),
    delete: vitest.fn(),
    getByToken: vitest.fn(),
    getAll: vitest.fn(),
  };
};
