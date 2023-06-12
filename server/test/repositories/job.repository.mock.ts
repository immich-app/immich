import { IJobRepository } from '@app/domain';

export const newJobRepositoryMock = (): jest.Mocked<IJobRepository> => {
  return {
    addHandler: jest.fn(),
    setConcurrency: jest.fn(),
    empty: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    queue: jest.fn().mockImplementation(() => Promise.resolve()),
    getQueueStatus: jest.fn(),
    getJobCounts: jest.fn(),
  };
};
