import { StackRepository } from 'src/repositories/stack.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newStackRepositoryMock = (): Mocked<RepositoryInterface<StackRepository>> => {
  return {
    search: vitest.fn(),
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getById: vitest.fn(),
    deleteAll: vitest.fn(),
  };
};
