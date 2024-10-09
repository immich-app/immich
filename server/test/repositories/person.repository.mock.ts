import { IPersonRepository } from 'src/interfaces/person.interface';
import { Mocked, vitest } from 'vitest';

export const newPersonRepositoryMock = (): Mocked<IPersonRepository> => {
  return {
    getById: vitest.fn(),
    getAll: vitest.fn(),
    getAllForUser: vitest.fn(),
    getAllWithoutFaces: vitest.fn(),

    getByName: vitest.fn(),
    getDistinctNames: vitest.fn(),

    create: vitest.fn(),
    createAll: vitest.fn(),
    update: vitest.fn(),
    updateAll: vitest.fn(),
    delete: vitest.fn(),
    deleteAll: vitest.fn(),
    deleteFaces: vitest.fn(),

    getStatistics: vitest.fn(),
    getAllFaces: vitest.fn(),
    getFacesByIds: vitest.fn(),
    getRandomFace: vitest.fn(),

    reassignFaces: vitest.fn(),
    unassignFaces: vitest.fn(),
    createFaces: vitest.fn(),
    refreshFaces: vitest.fn(),
    getFaces: vitest.fn(),
    reassignFace: vitest.fn(),
    getFaceById: vitest.fn(),
    getFaceByIdWithAssets: vitest.fn(),
    getNumberOfPeople: vitest.fn(),
    getLatestFaceDate: vitest.fn(),
  };
};
