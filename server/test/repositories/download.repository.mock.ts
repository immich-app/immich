import { DownloadRepository } from 'src/repositories/download.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newDownloadRepositoryMock = (): Mocked<RepositoryInterface<DownloadRepository>> => {
  return {
    downloadAssetIds: vitest.fn(),
    downloadMotionAssetIds: vitest.fn(),
    downloadAlbumId: vitest.fn(),
    downloadUserId: vitest.fn(),
  };
};
