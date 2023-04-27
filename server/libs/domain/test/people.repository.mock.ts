import { IPeopleRepository } from '../src';

export const newPeopleRepositoryMock = (): jest.Mocked<IPeopleRepository> => {
  return {
    create: jest.fn(),
    getById: jest.fn(),
    getAll: jest.fn(),
    save: jest.fn(),
    getPersonAssets: jest.fn(),

    // faces
    getAllFaces: jest.fn(),
    getFaceByIds: jest.fn(),
  };
};
