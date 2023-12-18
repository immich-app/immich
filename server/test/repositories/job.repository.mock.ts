import { IJobRepository } from '@app/domain';

export const newJobRepositoryMock = (): jest.Mocked<IJobRepository> => {
  return {
    addHandler: jest.fn(),
    addCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
    updateCronJob: jest.fn(),
    setConcurrency: jest.fn(),
    empty: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    queue: jest.fn().mockImplementation(() => Promise.resolve()),
    getQueueStatus: jest.fn(),
    getJobCounts: jest.fn(),
    clear: jest.fn(),
  };
};
