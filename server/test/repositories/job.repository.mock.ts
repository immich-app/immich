import { IJobRepository } from '@app/domain';

export const newJobRepositoryMock = (): jest.Mocked<IJobRepository> => {
  return {
    addHandler: jest.fn(),
    setConcurrency: jest.fn(),
    pause: jest.fn(),
    pauseAll: jest.fn(),
    resume: jest.fn(),
    resumeAll: jest.fn(),
    empty: jest.fn(),
    emptyAll: jest.fn(),
    queue: jest.fn().mockImplementation(() => Promise.resolve()),
    getQueueStatus: jest.fn(),
    getJobCounts: jest.fn(),
  };
};
