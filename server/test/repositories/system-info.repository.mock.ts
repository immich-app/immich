import { IServerInfoRepository } from 'src/interfaces/server-info.interface';

export const newServerInfoRepositoryMock = (): jest.Mocked<IServerInfoRepository> => {
  return {
    getGitHubRelease: jest.fn(),
  };
};
