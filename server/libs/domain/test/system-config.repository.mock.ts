import { ISystemConfigRepository } from '../src';

export const newSystemConfigRepositoryMock = (): jest.Mocked<ISystemConfigRepository> => {
  return {
    load: jest.fn(),
    saveAll: jest.fn(),
    deleteKeys: jest.fn(),
  };
};
