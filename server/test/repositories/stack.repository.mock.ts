import { IStackRepository } from 'src/interfaces/stack.interface';
import { Mocked, vitest } from 'vitest';

export const newStackRepositoryMock = (): Mocked<IStackRepository> => {
  return {
    search: vitest.fn(),
    create: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
    getById: vitest.fn(),
    deleteAll: vitest.fn(),
  };
};
