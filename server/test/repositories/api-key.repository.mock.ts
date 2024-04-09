import { IKeyRepository } from 'src/interfaces/api-key.interface';

export const newKeyRepositoryMock = (): jest.Mocked<IKeyRepository> => {
  return {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getKey: jest.fn(),
    getById: jest.fn(),
    getByUserId: jest.fn(),
  };
};
