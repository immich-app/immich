import { UserRepository } from 'src/repositories/user.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newUserRepositoryMock = (): Mocked<RepositoryInterface<UserRepository>> => {
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
    restore: vitest.fn(),
    getDeletedUsers: vitest.fn(),
    hasAdmin: vitest.fn(),
    updateUsage: vitest.fn(),
    syncUsage: vitest.fn(),
    upsertMetadata: vitest.fn(),
    deleteMetadata: vitest.fn(),
  };
};
