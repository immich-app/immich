import { IServerInfoRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newServerInfoRepositoryMock = (): Mocked<IServerInfoRepository> => {
  return {
    getGitHubRelease: vi.fn(),
  };
};
