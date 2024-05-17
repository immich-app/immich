import { SystemConfigCore } from 'src/cores/system-config.core';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { Mocked, vitest } from 'vitest';

export const newSystemMetadataRepositoryMock = (reset = true): Mocked<ISystemMetadataRepository> => {
  if (reset) {
    SystemConfigCore.reset();
  }

  return {
    get: vitest.fn() as any,
    set: vitest.fn(),
    readFile: vitest.fn(),
    fetchStyle: vitest.fn(),
  };
};
