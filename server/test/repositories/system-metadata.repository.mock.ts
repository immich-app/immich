import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { RepositoryInterface } from 'src/types';
import { clearConfigCache } from 'src/utils/config';
import { Mocked, vitest } from 'vitest';

export const newSystemMetadataRepositoryMock = (): Mocked<RepositoryInterface<SystemMetadataRepository>> => {
  clearConfigCache();
  return {
    get: vitest.fn() as any,
    set: vitest.fn(),
    delete: vitest.fn(),
    readFile: vitest.fn(),
  };
};
