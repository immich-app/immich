import { ITrashRepository } from 'src/interfaces/trash.interface';
import { Mocked, vitest } from 'vitest';

export const newTrashRepositoryMock = (): Mocked<ITrashRepository> => {
  return {
    empty: vitest.fn(),
    restore: vitest.fn(),
    restoreAll: vitest.fn(),
    getDeletedIds: vitest.fn(),
  };
};
