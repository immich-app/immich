import { IMetadataRepository } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newMetadataRepositoryMock = (): Mocked<IMetadataRepository> => {
  return {
    teardown: vitest.fn(),
    readTags: vitest.fn(),
    writeTags: vitest.fn(),
    extractBinaryTag: vitest.fn(),
  };
};
