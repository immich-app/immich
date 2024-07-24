import { IMetadataRepository } from 'src/interfaces/metadata.interface';
import { Mocked, vitest } from 'vitest';

export const newMetadataRepositoryMock = (): Mocked<IMetadataRepository> => {
  return {
    teardown: vitest.fn(),
    readTags: vitest.fn(),
    writeTags: vitest.fn(),
    extractBinaryTag: vitest.fn(),
    getCameraMakes: vitest.fn(),
    getCameraModels: vitest.fn(),
    getCities: vitest.fn(),
    getCountries: vitest.fn(),
    getStates: vitest.fn(),
  };
};
