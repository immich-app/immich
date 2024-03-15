import { IPartnerRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newPartnerRepositoryMock = (): Mocked<IPartnerRepository> => {
  return {
    create: vi.fn(),
    remove: vi.fn(),
    getAll: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
  };
};
