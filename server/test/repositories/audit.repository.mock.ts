import { IAuditRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newAuditRepositoryMock = (): Mocked<IAuditRepository> => {
  return {
    getAfter: vi.fn(),
    removeBefore: vi.fn(),
  };
};
