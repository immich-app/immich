import { IMetadataRepository } from '@app/domain';

export const newMetadataRepositoryMock = (): jest.Mocked<IMetadataRepository> => {
  return {
    deleteCache: jest.fn(),
    getExifTags: jest.fn(),
    initLocalGeocoding: jest.fn(),
    teardown: jest.fn(),
    reverseGeocode: jest.fn(),
  };
};
