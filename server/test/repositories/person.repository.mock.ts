import { IPersonRepository } from 'src/interfaces/person.interface';
import { Mocked, vitest } from 'vitest';

export const newPersonRepositoryMock = (): Mocked<IPersonRepository> => {
  return {
    getById: vitest.fn(),
    getAll: vitest.fn(),
    getAllForUser: vitest.fn(),
    getAssets: vitest.fn(),
    getAllWithoutFaces: vitest.fn(),

    getByName: vitest.fn(),

    create: vitest.fn(),
    update: vitest.fn(),
    deleteAll: vitest.fn(),
    delete: vitest.fn(),
    deleteAllFaces: vitest.fn(),

    getStatistics: vitest.fn(),
    getAllFaces: vitest.fn(),
    getFacesByIds: vitest.fn(),
    getRandomFace: vitest.fn(),

    reassignFaces: vitest.fn(),
    createFaces: vitest.fn(),
    getFaces: vitest.fn(),
    reassignFace: vitest.fn(),
    getFaceById: vitest.fn(),
    getFaceByIdWithAssets: vitest.fn(),
    getNumberOfPeople: vitest.fn(),
  };
};
