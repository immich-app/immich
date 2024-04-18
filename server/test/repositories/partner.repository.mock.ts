import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { Mocked, vitest } from 'vitest';

export const newPartnerRepositoryMock = (): Mocked<IPartnerRepository> => {
  return {
    create: vitest.fn(),
    remove: vitest.fn(),
    getAll: vitest.fn(),
    get: vitest.fn(),
    update: vitest.fn(),
  };
};
