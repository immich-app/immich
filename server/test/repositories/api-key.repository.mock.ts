import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newKeyRepositoryMock = (): Mocked<RepositoryInterface<ApiKeyRepository>> => {
  return {
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getKey: vitest.fn(),
    getById: vitest.fn(),
    getByUserId: vitest.fn(),
  };
};
