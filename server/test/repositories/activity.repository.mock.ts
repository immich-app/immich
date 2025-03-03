import { ActivityRepository } from 'src/repositories/activity.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newActivityRepositoryMock = (): Mocked<RepositoryInterface<ActivityRepository>> => {
  return {
    search: vitest.fn(),
    create: vitest.fn(),
    delete: vitest.fn(),
    getStatistics: vitest.fn(),
  };
};
