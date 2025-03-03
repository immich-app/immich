import { PartnerRepository } from 'src/repositories/partner.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newPartnerRepositoryMock = (): Mocked<RepositoryInterface<PartnerRepository>> => {
  return {
    create: vitest.fn(),
    remove: vitest.fn(),
    getAll: vitest.fn().mockResolvedValue([]),
    get: vitest.fn(),
    update: vitest.fn(),
  };
};
