import { IAlbumUserRepository } from 'src/types';
import { Mocked } from 'vitest';

export const newAlbumUserRepositoryMock = (): Mocked<IAlbumUserRepository> => {
  return {
    create: vitest.fn(),
    delete: vitest.fn(),
    update: vitest.fn(),
  };
};
