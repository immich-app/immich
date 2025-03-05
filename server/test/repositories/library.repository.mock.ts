import { LibraryRepository } from 'src/repositories/library.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newLibraryRepositoryMock = (): Mocked<RepositoryInterface<LibraryRepository>> => {
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
