import { IMachineLearningRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newMachineLearningRepositoryMock = (): Mocked<IMachineLearningRepository> => {
  return {
    encodeImage: vi.fn(),
    encodeText: vi.fn(),
    detectFaces: vi.fn(),
  };
};
