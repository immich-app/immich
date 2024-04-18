import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { Mocked, vitest } from 'vitest';

export const newServerInfoRepositoryMock = (): Mocked<IServerInfoRepository> => {
  return {
    getGitHubRelease: vitest.fn(),
  };
};
