import { IServerInfoRepository } from 'src/interfaces/server-info.repository';

export const newServerInfoRepositoryMock = (): jest.Mocked<IServerInfoRepository> => {
  return {
    getGitHubRelease: jest.fn(),
  };
};
