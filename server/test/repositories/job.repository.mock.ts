import { IJobRepository } from 'src/interfaces/job.interface';
import { Mocked, vitest } from 'vitest';

export const newJobRepositoryMock = (): Mocked<IJobRepository> => {
  return {
    addHandler: vitest.fn(),
    addCronJob: vitest.fn(),
    updateCronJob: vitest.fn(),
    setConcurrency: vitest.fn(),
    empty: vitest.fn(),
    pause: vitest.fn(),
    resume: vitest.fn(),
    queue: vitest.fn().mockImplementation(() => Promise.resolve()),
    queueAll: vitest.fn().mockImplementation(() => Promise.resolve()),
    getQueueStatus: vitest.fn(),
    getJobCounts: vitest.fn(),
    clear: vitest.fn(),
    waitForQueueCompletion: vitest.fn(),
  };
};
