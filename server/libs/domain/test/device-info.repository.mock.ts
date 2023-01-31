import { IDeviceInfoRepository } from '../src';

export const newDeviceInfoRepositoryMock = (): jest.Mocked<IDeviceInfoRepository> => {
  return {
    get: jest.fn(),
    save: jest.fn(),
  };
};
