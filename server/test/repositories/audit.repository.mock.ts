import { IAuditRepository } from '@app/domain';

export const newAuditRepositoryMock = (): jest.Mocked<IAuditRepository> => {
  return {
    countOlderForOwner: jest.fn(),
    getNewestForOwnerSince: jest.fn(),
  };
};
