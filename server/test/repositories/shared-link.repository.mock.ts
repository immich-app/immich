import { SharedLinkRepository } from 'src/repositories/shared-link.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newSharedLinkRepositoryMock = (): Mocked<RepositoryInterface<SharedLinkRepository>> => {
  return {
    getAll: vitest.fn(),
    get: vitest.fn(),
    getByKey: vitest.fn(),
    create: vitest.fn(),
    remove: vitest.fn(),
    update: vitest.fn(),
  };
};
