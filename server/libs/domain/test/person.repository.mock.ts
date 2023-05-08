import { IPersonRepository } from '../src';

export const newPersonRepositoryMock = (): jest.Mocked<IPersonRepository> => {
  return {
    getById: jest.fn(),
    getAll: jest.fn(),
    getAssets: jest.fn(),

    create: jest.fn(),
    update: jest.fn(),
    deleteAll: jest.fn(),
  };
};
