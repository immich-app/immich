import { IMetadataRepository } from '@app/domain';

export const newMetadataRepositoryMock = (): jest.Mocked<IMetadataRepository> => {
  return {
    deleteCache: jest.fn(),
    getDuration: jest.fn(),
    getExifTags: jest.fn(),
    getTimezone: jest.fn(),
    init: jest.fn(),
    mapExifEntity: jest.fn(),
    reverseGeocode: jest.fn(),
  };
};
