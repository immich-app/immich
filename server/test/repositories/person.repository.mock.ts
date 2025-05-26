import { PersonRepository } from 'src/repositories/person.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newPersonRepositoryMock = (): Mocked<RepositoryInterface<PersonRepository>> => {
  return {
    reassignFaces: vitest.fn(),
    unassignFaces: vitest.fn(),
    delete: vitest.fn(),
    deleteFaces: vitest.fn(),
    getAllFaces: vitest.fn(),
    getAll: vitest.fn(),
    getAllForUser: vitest.fn(),
    getAllWithoutFaces: vitest.fn(),
    getFaces: vitest.fn(),
    getFaceById: vitest.fn(),
    getFaceForFacialRecognitionJob: vitest.fn(),
    getDataForThumbnailGenerationJob: vitest.fn(),
    reassignFace: vitest.fn(),
    getById: vitest.fn(),
    getByName: vitest.fn(),
    getDistinctNames: vitest.fn(),
    getStatistics: vitest.fn(),
    getNumberOfPeople: vitest.fn(),
    create: vitest.fn(),
    createAll: vitest.fn(),
    refreshFaces: vitest.fn(),
    update: vitest.fn(),
    updateAll: vitest.fn(),
    getFacesByIds: vitest.fn(),
    getRandomFace: vitest.fn(),
    getLatestFaceDate: vitest.fn(),
    createAssetFace: vitest.fn(),
    deleteAssetFace: vitest.fn(),
    softDeleteAssetFaces: vitest.fn(),
    vacuum: vitest.fn(),
  };
};
