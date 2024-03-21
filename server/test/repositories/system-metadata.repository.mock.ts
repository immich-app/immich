import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';

export const newSystemMetadataRepositoryMock = (): jest.Mocked<ISystemMetadataRepository> => {
  return {
    get: jest.fn(),
    set: jest.fn(),
  };
};
