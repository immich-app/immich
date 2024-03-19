import { ISystemMetadataRepository } from 'src/domain/repositories/system-metadata.repository';

export const newSystemMetadataRepositoryMock = (): jest.Mocked<ISystemMetadataRepository> => {
  return {
    get: jest.fn(),
    set: jest.fn(),
  };
};
