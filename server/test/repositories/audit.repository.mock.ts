import { IAuditRepository } from 'src/domain';

export const newAuditRepositoryMock = (): jest.Mocked<IAuditRepository> => {
  return {
    getAfter: jest.fn(),
    removeBefore: jest.fn(),
  };
};
