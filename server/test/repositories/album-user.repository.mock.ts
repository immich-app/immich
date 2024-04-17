import { IAlbumUserRepository } from 'src/interfaces/album-user.interface';

export const newAlbumUserRepositoryMock = (): jest.Mocked<IAlbumUserRepository> => {
  return {
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
};
