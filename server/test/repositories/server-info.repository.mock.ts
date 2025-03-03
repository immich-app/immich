import { ServerInfoRepository } from 'src/repositories/server-info.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newServerInfoRepositoryMock = (): Mocked<RepositoryInterface<ServerInfoRepository>> => {
  return {
    getGitHubRelease: vitest.fn(),
    getBuildVersions: vitest.fn(),
  };
};
