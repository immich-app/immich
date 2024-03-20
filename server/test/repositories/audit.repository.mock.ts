import { IAuditRepository } from 'src/domain/repositories/audit.repository';

export const newAuditRepositoryMock = (): jest.Mocked<IAuditRepository> => {
  return {
    getAfter: jest.fn(),
    removeBefore: jest.fn(),
  };
};
