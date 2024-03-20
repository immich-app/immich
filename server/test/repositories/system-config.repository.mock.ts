import { SystemConfigCore } from 'src/cores/system-config.core';
import { ISystemConfigRepository } from 'src/interfaces/system-config.repository';

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
