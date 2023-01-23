import { IJobRepository } from '../src';

export const newJobRepositoryMock = (): jest.Mocked<IJobRepository> => {
  return {
    add: jest.fn().mockImplementation(() => Promise.resolve()),
  };
};
