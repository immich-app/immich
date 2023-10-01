import { ISystemConfigRepository, SystemConfigCore } from '@app/domain';

export const newSystemConfigRepositoryMock = (reset = true): jest.Mocked<ISystemConfigRepository> => {
  if (reset) {
    SystemConfigCore.reset();
  }

  return {
    fetchStyle: jest.fn(),
    load: jest.fn().mockResolvedValue([]),
    readFile: jest.fn(),
    saveAll: jest.fn().mockResolvedValue([]),
    deleteKeys: jest.fn(),
  };
};
