import { IActivityRepository } from '@app/domain';

export const newActivityRepositoryMock = (): jest.Mocked<IActivityRepository> => {
  return {
    update: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
    getStatistics: jest.fn(),
  };
};
