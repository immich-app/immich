import { IFaceRepository } from '../src';

export const newFaceRepositoryMock = (): jest.Mocked<IFaceRepository> => {
  return {
    getAll: jest.fn(),
    getByIds: jest.fn(),
    create: jest.fn(),
  };
};
