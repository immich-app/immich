import { AlbumUserRepository } from 'src/repositories/album-user.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked } from 'vitest';

export const newAlbumUserRepositoryMock = (): Mocked<RepositoryInterface<AlbumUserRepository>> => {
  return {
    create: vitest.fn(),
    delete: vitest.fn(),
    update: vitest.fn(),
  };
};
