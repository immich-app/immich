import { ITagRepository } from '../src';

export const newTagRepositoryMock = (): jest.Mocked<ITagRepository> => {
  return {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
};
