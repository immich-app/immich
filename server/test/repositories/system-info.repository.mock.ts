import { IServerInfoRepository } from 'src/domain';

export const newServerInfoRepositoryMock = (): jest.Mocked<IServerInfoRepository> => {
  return {
    getGitHubRelease: jest.fn(),
  };
};
