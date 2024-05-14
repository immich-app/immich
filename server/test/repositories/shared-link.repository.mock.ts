import { ISharedLinkRepository } from 'src/interfaces/shared-link.interface';
import { Mocked, vitest } from 'vitest';

export const newSharedLinkRepositoryMock = (): Mocked<ISharedLinkRepository> => {
  return {
    getAll: vitest.fn(),
    get: vitest.fn(),
    getByKey: vitest.fn(),
    create: vitest.fn(),
    remove: vitest.fn(),
    update: vitest.fn(),
  };
};
