import { ILibraryRepository } from '@app/domain';

export const newLibraryRepositoryMock = (): jest.Mocked<ILibraryRepository> => {
  return {
    get: jest.fn(),
    getCountForUser: jest.fn(),
    getById: jest.fn(),
    setImportPaths: jest.fn(),
    getAllByUserId: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    getDefaultUploadLibrary: jest.fn(),
  };
};
