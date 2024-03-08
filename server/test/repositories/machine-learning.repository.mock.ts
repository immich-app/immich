import { IMachineLearningRepository } from '@app/domain';

export const newMachineLearningRepositoryMock = (): jest.Mocked<IMachineLearningRepository> => {
  return {
    encodeImage: jest.fn(),
    encodeText: jest.fn(),
    detectFaces: jest.fn(),
  };
};
