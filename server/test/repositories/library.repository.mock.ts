import { ILibraryRepository } from 'src/interfaces/library.repository';

export const newLibraryRepositoryMock = (): jest.Mocked<ILibraryRepository> => {
  return {
    get: jest.fn(),
    getCountForUser: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    update: jest.fn(),
    getStatistics: jest.fn(),
    getDefaultUploadLibrary: jest.fn(),
    getUploadLibraryCount: jest.fn(),
    getAssetIds: jest.fn(),
    getAllDeleted: jest.fn(),
    getAll: jest.fn(),
  };
};
