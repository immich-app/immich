import { ISmartInfoRepository } from '@app/domain';

export const newSmartInfoRepositoryMock = (): jest.Mocked<ISmartInfoRepository> => {
  return {
    upsert: jest.fn(),
  };
};
