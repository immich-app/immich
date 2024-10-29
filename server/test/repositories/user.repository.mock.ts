import { IUserRepository } from 'src/interfaces/user.interface';
import { Mocked, vitest } from 'vitest';

export const newUserRepositoryMock = (): Mocked<IUserRepository> => {
  return {
    get: vitest.fn(),
    getAdmin: vitest.fn(),
    getByEmail: vitest.fn(),
    getByStorageLabel: vitest.fn(),
    getByOAuthId: vitest.fn(),
    getUserStats: vitest.fn(),
    getList: vitest.fn(),
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getDeletedUsers: vitest.fn(),
    hasAdmin: vitest.fn(),
    updateUsage: vitest.fn(),
    syncUsage: vitest.fn(),
    upsertMetadata: vitest.fn(),
    deleteMetadata: vitest.fn(),
  };
};
