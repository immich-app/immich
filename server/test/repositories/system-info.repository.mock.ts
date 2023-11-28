import { IServerInfoRepository } from '@app/domain';

export const newServerInfoRepositoryMock = (): jest.Mocked<IServerInfoRepository> => {
  return {
    getGitHubRelease: jest.fn(),
  };
};
