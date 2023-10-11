import { IMoveRepository } from '@app/domain';

export const newMoveRepositoryMock = (): jest.Mocked<IMoveRepository> => {
  return {
    create: jest.fn(),
    getByEntity: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
};
