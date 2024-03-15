import { ILibraryRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newLibraryRepositoryMock = (): Mocked<ILibraryRepository> => {
  return {
    get: vi.fn(),
    getCountForUser: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    softDelete: vi.fn(),
    update: vi.fn(),
    getStatistics: vi.fn(),
    getDefaultUploadLibrary: vi.fn(),
    getUploadLibraryCount: vi.fn(),
    getAssetIds: vi.fn(),
    getAllDeleted: vi.fn(),
    getAll: vi.fn(),
  };
};
