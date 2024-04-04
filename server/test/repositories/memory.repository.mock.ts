import { IMemoryRepository } from 'src/interfaces/memory.interface';

export const newMemoryRepositoryMock = (): jest.Mocked<IMemoryRepository> => {
  return {
    search: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getAssetIds: jest.fn().mockResolvedValue(new Set()),
    addAssetIds: jest.fn(),
    removeAssetIds: jest.fn(),
  };
};
