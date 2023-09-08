import { IPersonRepository } from '@app/domain';

export const newPersonRepositoryMock = (): jest.Mocked<IPersonRepository> => {
  return {
    getById: jest.fn(),
    getAll: jest.fn(),
    getAllWithoutThumbnail: jest.fn(),
    getAllForUser: jest.fn(),
    getAssets: jest.fn(),
    getAllWithoutFaces: jest.fn(),

    create: jest.fn(),
    update: jest.fn(),
    deleteAll: jest.fn(),
    delete: jest.fn(),

    getFaceById: jest.fn(),
    getRandomFace: jest.fn(),
    prepareReassignFaces: jest.fn(),
    reassignFaces: jest.fn(),
  };
};
