import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { clearConfigCache } from 'src/utils/config';
import { Mocked, vitest } from 'vitest';

export const newSystemMetadataRepositoryMock = (): Mocked<ISystemMetadataRepository> => {
  clearConfigCache();
  return {
    get: vitest.fn() as any,
    set: vitest.fn(),
    delete: vitest.fn(),
    readFile: vitest.fn(),
  };
};
