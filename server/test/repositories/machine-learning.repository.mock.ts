import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';

export const newMachineLearningRepositoryMock = (): jest.Mocked<IMachineLearningRepository> => {
  return {
    encodeImage: jest.fn(),
    encodeText: jest.fn(),
    detectFaces: jest.fn(),
  };
};
