import { IDatabaseRepository, Version } from '@app/domain';

export const newDatabaseRepositoryMock = (): jest.Mocked<IDatabaseRepository> => {
  return {
    getExtensionVersion: jest.fn(),
    getPostgresVersion: jest.fn().mockResolvedValue(new Version(14, 0, 0)),
    createExtension: jest.fn().mockImplementation(() => Promise.resolve()),
    runMigrations: jest.fn(),
  };
};
