import { IAuditRepository } from 'src/interfaces/audit.interface';

export const newAuditRepositoryMock = (): jest.Mocked<IAuditRepository> => {
  return {
    getAfter: jest.fn(),
    removeBefore: jest.fn(),
  };
};
