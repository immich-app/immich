import { IServerInfoRepository } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newServerInfoRepositoryMock = (): Mocked<IServerInfoRepository> => {
  return {
    getGitHubRelease: vitest.fn(),
    getBuildVersions: vitest.fn(),
  };
};
