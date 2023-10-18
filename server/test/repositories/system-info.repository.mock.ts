import { IServerInfoRepository } from '@app/domain';

export const newSystemConfigRepositoryMock = (): jest.Mocked<IServerInfoRepository> => {
  return {
    getLatestAvailableVersion: jest.fn(),
  };
};
