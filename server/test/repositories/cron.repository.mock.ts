import { CronRepository } from 'src/repositories/cron.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newCronRepositoryMock = (): Mocked<RepositoryInterface<CronRepository>> => {
  return {
    create: vitest.fn(),
    update: vitest.fn(),
  };
};
