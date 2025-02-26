import { MachineLearningRepository } from 'src/repositories/machine-learning.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newMachineLearningRepositoryMock = (): Mocked<RepositoryInterface<MachineLearningRepository>> => {
  return {
    encodeImage: vitest.fn(),
    encodeText: vitest.fn(),
    detectFaces: vitest.fn(),
  };
};
