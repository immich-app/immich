import { IJobRepository } from '../src';

export const newJobRepositoryMock = (): jest.Mocked<IJobRepository> => {
  return {
    empty: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    queue: jest.fn().mockImplementation(() => Promise.resolve()),
    isActive: jest.fn(),
    getJobCounts: jest.fn(),
  };
};
