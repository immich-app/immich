import { IAlbumRepository } from '../src';

export const newAlbumRepositoryMock = (): jest.Mocked<IAlbumRepository> => {
  return {
    deleteAll: jest.fn(),
  };
};
