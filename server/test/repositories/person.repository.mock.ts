import { IPersonRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newPersonRepositoryMock = (): Mocked<IPersonRepository> => {
  return {
    getById: vi.fn(),
    getAll: vi.fn(),
    getAllForUser: vi.fn(),
    getAssets: vi.fn(),
    getAllWithoutFaces: vi.fn(),

    getByName: vi.fn(),

    create: vi.fn(),
    update: vi.fn(),
    deleteAll: vi.fn(),
    delete: vi.fn(),
    deleteAllFaces: vi.fn(),

    getStatistics: vi.fn(),
    getAllFaces: vi.fn(),
    getFacesByIds: vi.fn(),
    getRandomFace: vi.fn(),

    reassignFaces: vi.fn(),
    createFaces: vi.fn(),
    getFaces: vi.fn(),
    reassignFace: vi.fn(),
    getFaceById: vi.fn(),
    getFaceByIdWithAssets: vi.fn(),
    getNumberOfPeople: vi.fn(),
  };
};
