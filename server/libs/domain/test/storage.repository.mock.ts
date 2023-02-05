import { IStorageRepository } from '../src';

export const newStorageRepositoryMock = (): jest.Mocked<IStorageRepository> => {
  return {
    createReadStream: jest.fn(),
  };
};
