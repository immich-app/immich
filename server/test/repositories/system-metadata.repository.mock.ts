import { ISystemMetadataRepository } from 'src/domain';

export const newSystemMetadataRepositoryMock = (): jest.Mocked<ISystemMetadataRepository> => {
  return {
    get: jest.fn(),
    set: jest.fn(),
  };
};
