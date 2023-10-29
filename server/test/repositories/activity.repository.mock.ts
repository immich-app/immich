import { IActivityRepository } from '@app/domain';

export const newActivityRepositoryMock = (): jest.Mocked<IActivityRepository> => {
  return {
    update: jest.fn(),
    getById: jest.fn(),
    getFavorite: jest.fn(),
    delete: jest.fn(),
    getReactionById: jest.fn(),
    getStatistics: jest.fn(),
  };
};
