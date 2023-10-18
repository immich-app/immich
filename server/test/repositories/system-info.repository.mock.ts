import { ISystemInfoRepository } from '@app/domain';

export const newSystemConfigRepositoryMock = (reset = true): jest.Mocked<ISystemInfoRepository> => {
  return {
    getLatestAvailableVersion: jest.fn(),
  };
};
