import { JobRepository } from 'src/repositories/job.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newJobRepositoryMock = (): Mocked<RepositoryInterface<JobRepository>> => {
  return {
    setup: vitest.fn(),
    start: vitest.fn(),
    stop: vitest.fn(),
    pause: vitest.fn(),
    resume: vitest.fn(),
    run: vitest.fn(),
    queue: vitest.fn().mockImplementation(() => Promise.resolve()),
    queueAll: vitest.fn().mockImplementation(() => Promise.resolve()),
    clear: vitest.fn(),
    clearFailed: vitest.fn(),
    getJobCounts: vitest.fn(),
    getQueueStatus: vitest.fn(),
  };
};
