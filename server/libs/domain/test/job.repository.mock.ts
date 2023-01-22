import { IJobRepository } from '../src';

export const newJobRepositoryMock = (): jest.Mocked<IJobRepository> => {
  return {
    empty: jest.fn(),
    add: jest.fn().mockImplementation(() => Promise.resolve()),
    isActive: jest.fn(),
    getJobCounts: jest.fn(),
  };
};
