import { IActivityRepository } from 'src/interfaces/activity.repository';

export const newActivityRepositoryMock = (): jest.Mocked<IActivityRepository> => {
  return {
    search: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    getStatistics: jest.fn(),
  };
};
