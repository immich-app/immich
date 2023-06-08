import { ISystemConfigRepository } from '@app/domain';

export const newSystemConfigRepositoryMock = (): jest.Mocked<ISystemConfigRepository> => {
  return {
    load: jest.fn().mockResolvedValue([]),
    saveAll: jest.fn().mockResolvedValue([]),
    deleteKeys: jest.fn(),
  };
};
