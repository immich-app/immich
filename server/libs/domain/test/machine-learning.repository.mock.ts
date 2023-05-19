import { IMachineLearningRepository } from '../src';

export const newMachineLearningRepositoryMock = (): jest.Mocked<IMachineLearningRepository> => {
  return {
    classifyImage: jest.fn(),
    detectObjects: jest.fn(),
    encodeImage: jest.fn(),
    encodeText: jest.fn(),
    detectFaces: jest.fn(),
  };
};
