import { IActivityRepository } from '@app/domain';

export const newCryptoRepositoryMock = (): jest.Mocked<IActivityRepository> => {
  return {
    getById: jest.fn(),
    update: jest.fn(),
  };
};
