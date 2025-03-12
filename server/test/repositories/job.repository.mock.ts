import { JobRepository } from 'src/repositories/job.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newJobRepositoryMock = (): Mocked<RepositoryInterface<JobRepository>> => {
  return {
    setup: vitest.fn(),
    startWorkers: vitest.fn(),
    run: vitest.fn(),
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
    removeJob: vitest.fn(),
  };
};
