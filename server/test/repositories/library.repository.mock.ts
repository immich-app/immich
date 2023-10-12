import { ILibraryRepository } from '@app/domain';

export const newLibraryRepositoryMock = (): jest.Mocked<ILibraryRepository> => {
  return {
    get: jest.fn(),
    getCountForUser: jest.fn(),
    getAllByUserId: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    update: jest.fn(),
    getStatistics: jest.fn(),
    getDefaultUploadLibrary: jest.fn(),
    getUploadLibraryCount: jest.fn(),
    getOnlineAssetPaths: jest.fn(),
    getAssetIds: jest.fn(),
    existsByName: jest.fn(),
    getAllDeleted: jest.fn(),
    getAll: jest.fn(),
  };
};
