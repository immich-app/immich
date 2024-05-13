import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { Mocked, vitest } from 'vitest';

export const newMachineLearningRepositoryMock = (): Mocked<IMachineLearningRepository> => {
  return {
    encodeImage: vitest.fn(),
    encodeText: vitest.fn(),
    detectFaces: vitest.fn(),
  };
};
