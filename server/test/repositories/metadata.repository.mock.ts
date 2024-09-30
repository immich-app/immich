import { IMetadataRepository } from 'src/interfaces/metadata.interface';
import { Mocked, vitest } from 'vitest';

export const newMetadataRepositoryMock = (): Mocked<IMetadataRepository> => {
  return {
    teardown: vitest.fn(),
    readTags: vitest.fn(),
    writeTags: vitest.fn(),
    extractBinaryTag: vitest.fn(),
  };
};
