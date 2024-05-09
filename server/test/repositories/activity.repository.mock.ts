import { IActivityRepository } from 'src/interfaces/activity.interface';
import { Mocked, vitest } from 'vitest';

export const newActivityRepositoryMock = (): Mocked<IActivityRepository> => {
  return {
    search: vitest.fn(),
    create: vitest.fn(),
    delete: vitest.fn(),
    getStatistics: vitest.fn(),
  };
};
