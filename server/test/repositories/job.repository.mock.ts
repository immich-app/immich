import { IJobRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newJobRepositoryMock = (): Mocked<IJobRepository> => {
  return {
    addHandler: vi.fn(),
    addCronJob: vi.fn(),
    deleteCronJob: vi.fn(),
    updateCronJob: vi.fn(),
    setConcurrency: vi.fn(),
    empty: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    queue: vi.fn().mockImplementation(() => Promise.resolve()),
    queueAll: vi.fn().mockImplementation(() => Promise.resolve()),
    getQueueStatus: vi.fn(),
    getJobCounts: vi.fn(),
    clear: vi.fn(),
    waitForQueueCompletion: vi.fn(),
  };
};
