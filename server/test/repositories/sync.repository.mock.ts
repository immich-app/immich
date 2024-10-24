import { ISyncRepository } from 'src/interfaces/sync.interface';
import { Mocked, vitest } from 'vitest';

export const newSyncRepositoryMock = (): Mocked<ISyncRepository> => {
  return {
    get: vitest.fn(),
    upsert: vitest.fn(),

    getAssets: vitest.fn(),
    getAlbums: vitest.fn(),
    getAlbumAssets: vitest.fn(),
  };
};
