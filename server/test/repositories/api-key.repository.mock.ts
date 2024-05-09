import { IKeyRepository } from 'src/interfaces/api-key.interface';
import { Mocked, vitest } from 'vitest';

export const newKeyRepositoryMock = (): Mocked<IKeyRepository> => {
  return {
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getKey: vitest.fn(),
    getById: vitest.fn(),
    getByUserId: vitest.fn(),
  };
};
