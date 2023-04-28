import { IPersonRepository } from '../src';

export const newPeopleRepositoryMock = (): jest.Mocked<IPersonRepository> => {
  return {
    create: jest.fn(),
    getById: jest.fn(),
    getAll: jest.fn(),
    save: jest.fn(),
    getAssets: jest.fn(),

    // faces
    getAllFaces: jest.fn(),
    getFaceByIds: jest.fn(),
  };
};
