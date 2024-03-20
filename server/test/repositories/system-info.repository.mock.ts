import { IServerInfoRepository } from 'src/domain/repositories/server-info.repository';

export const newServerInfoRepositoryMock = (): jest.Mocked<IServerInfoRepository> => {
  return {
    getGitHubRelease: jest.fn(),
  };
};
