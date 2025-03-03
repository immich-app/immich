import { SyncRepository } from 'src/repositories/sync.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newSyncRepositoryMock = (): Mocked<RepositoryInterface<SyncRepository>> => {
  return {
    getCheckpoints: vitest.fn(),
    upsertCheckpoints: vitest.fn(),
    deleteCheckpoints: vitest.fn(),
    getUserUpserts: vitest.fn(),
    getUserDeletes: vitest.fn(),
  };
};
