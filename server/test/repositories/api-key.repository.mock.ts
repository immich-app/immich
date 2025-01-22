import { IApiKeyRepository } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newKeyRepositoryMock = (): Mocked<IApiKeyRepository> => {
  return {
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getKey: vitest.fn(),
    getById: vitest.fn(),
    getByUserId: vitest.fn(),
  };
};
