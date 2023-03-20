import { IAlbumRepository } from '../src';

export const newAlbumRepositoryMock = (): jest.Mocked<IAlbumRepository> => {
  return {
    getByIds: jest.fn(),
    deleteAll: jest.fn(),
    getAll: jest.fn(),
    save: jest.fn(),
  };
};
