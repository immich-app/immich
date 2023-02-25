import { ISmartInfoRepository } from '../src';

export const newSmartInfoRepositoryMock = (): jest.Mocked<ISmartInfoRepository> => {
  return {
    upsert: jest.fn(),
  };
};
