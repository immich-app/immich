import { MetadataRepository } from 'src/repositories/metadata.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newMetadataRepositoryMock = (): Mocked<RepositoryInterface<MetadataRepository>> => {
  return {
    teardown: vitest.fn(),
    readTags: vitest.fn(),
    writeTags: vitest.fn(),
    extractBinaryTag: vitest.fn(),
  };
};
