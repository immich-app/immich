import { ISystemMetadataRepository } from '@app/domain';

export const newSystemMetadataRepositoryMock = (): jest.Mocked<ISystemMetadataRepository> => {
  return {
    get: jest.fn(),
    set: jest.fn(),
  };
};
