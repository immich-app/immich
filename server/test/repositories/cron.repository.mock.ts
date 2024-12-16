import { ICronRepository } from 'src/interfaces/cron.interface';
import { Mocked, vitest } from 'vitest';

export const newCronRepositoryMock = (): Mocked<ICronRepository> => {
  return {
    create: vitest.fn(),
    update: vitest.fn(),
  };
};
