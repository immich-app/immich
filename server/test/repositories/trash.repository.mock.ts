import { ITrashRepository } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newTrashRepositoryMock = (): Mocked<ITrashRepository> => {
  return {
    empty: vitest.fn(),
    restore: vitest.fn(),
    restoreAll: vitest.fn(),
    getDeletedIds: vitest.fn(),
  };
};
