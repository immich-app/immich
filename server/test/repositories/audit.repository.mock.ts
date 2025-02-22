import { AuditRepository } from 'src/repositories/audit.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newAuditRepositoryMock = (): Mocked<RepositoryInterface<AuditRepository>> => {
  return {
    getAfter: vitest.fn(),
    removeBefore: vitest.fn(),
  };
};
