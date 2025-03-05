import { TrashRepository } from 'src/repositories/trash.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newTrashRepositoryMock = (): Mocked<RepositoryInterface<TrashRepository>> => {
  return {
    empty: vitest.fn(),
    restore: vitest.fn(),
    restoreAll: vitest.fn(),
    getDeletedIds: vitest.fn(),
  };
};
