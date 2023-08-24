import { IAuditRepository } from '@app/domain';

export const newAuditRepositoryMock = (): jest.Mocked<IAuditRepository> => {
  return {
    getAfter: jest.fn(),
    removeBefore: jest.fn(),
  };
};
