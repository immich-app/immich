import { IPartnerRepository } from '@app/domain';

export const newPartnerRepositoryMock = (): jest.Mocked<IPartnerRepository> => {
  return {
    create: jest.fn(),
    remove: jest.fn(),
    getAll: jest.fn(),
    get: jest.fn(),
  };
};
