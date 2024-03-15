import { IMetadataRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newMetadataRepositoryMock = (): Mocked<IMetadataRepository> => {
  return {
    init: vi.fn(),
    teardown: vi.fn(),
    reverseGeocode: vi.fn(),
    readTags: vi.fn(),
    writeTags: vi.fn(),
    extractBinaryTag: vi.fn(),
    getCameraMakes: vi.fn(),
    getCameraModels: vi.fn(),
    getCities: vi.fn(),
    getCountries: vi.fn(),
    getStates: vi.fn(),
  };
};
