import { ILibraryRepository } from 'src/interfaces/library.interface';
import { Mocked, vitest } from 'vitest';

export const newLibraryRepositoryMock = (): Mocked<ILibraryRepository> => {
  return {
    get: vitest.fn(),
    create: vitest.fn(),
    delete: vitest.fn(),
    softDelete: vitest.fn(),
    update: vitest.fn(),
    getStatistics: vitest.fn(),
    getAllDeleted: vitest.fn(),
    getAll: vitest.fn(),
  };
};
