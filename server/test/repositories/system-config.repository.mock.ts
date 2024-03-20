import { ISystemConfigRepository } from 'src/domain/repositories/system-config.repository';
import { SystemConfigCore } from 'src/domain/system-config/system-config.core';

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
