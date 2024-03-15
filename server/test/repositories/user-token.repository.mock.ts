import { IUserTokenRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newUserTokenRepositoryMock = (): Mocked<IUserTokenRepository> => {
  return {
    create: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    getByToken: vi.fn(),
    getAll: vi.fn(),
  };
};
