import { IUserRepository, UserCore } from '@app/domain';
import { Mocked } from 'vitest';

export const newUserRepositoryMock = (reset = true): Mocked<IUserRepository> => {
  if (reset) {
    UserCore.reset();
  }

  return {
    get: vi.fn(),
    getAdmin: vi.fn(),
    getByEmail: vi.fn(),
    getByStorageLabel: vi.fn(),
    getByOAuthId: vi.fn(),
    getUserStats: vi.fn(),
    getList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getDeletedUsers: vi.fn(),
    hasAdmin: vi.fn(),
    updateUsage: vi.fn(),
    syncUsage: vi.fn(),
  };
};
