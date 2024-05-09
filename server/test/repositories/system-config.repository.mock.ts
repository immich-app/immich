import { SystemConfigCore } from 'src/cores/system-config.core';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';
import { Mocked, vitest } from 'vitest';

export const newSystemConfigRepositoryMock = (reset = true): Mocked<ISystemConfigRepository> => {
  if (reset) {
    SystemConfigCore.reset();
  }

  return {
    fetchStyle: vitest.fn(),
    load: vitest.fn().mockResolvedValue([]),
    readFile: vitest.fn(),
    saveAll: vitest.fn().mockResolvedValue([]),
    deleteKeys: vitest.fn(),
  };
};
