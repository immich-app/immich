import { IAuditRepository } from 'src/interfaces/audit.interface';
import { Mocked, vitest } from 'vitest';

export const newAuditRepositoryMock = (): Mocked<IAuditRepository> => {
  return {
    getAfter: vitest.fn(),
    removeBefore: vitest.fn(),
  };
};
