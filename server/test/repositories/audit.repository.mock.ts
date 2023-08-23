import { IAuditRepository } from '@app/domain';

export const newAuditRepositoryMock = (): jest.Mocked<IAuditRepository> => {
  return {
    countBefore: jest.fn(),
    getAfter: jest.fn(),
    deleteBefore: jest.fn(),
  };
};
