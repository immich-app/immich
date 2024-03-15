import { DatabaseAction, EntityType } from '@app/infra/entities';
import {
  IAccessRepositoryMock,
  auditStub,
  authStub,
  newAccessRepositoryMock,
  newAssetRepositoryMock,
  newAuditRepositoryMock,
  newCryptoRepositoryMock,
  newPersonRepositoryMock,
  newStorageRepositoryMock,
  newUserRepositoryMock,
} from '@test';
import { Mocked } from 'vitest';
import {
  IAssetRepository,
  IAuditRepository,
  ICryptoRepository,
  IPersonRepository,
  IStorageRepository,
  IUserRepository,
  JobStatus,
} from '../repositories';
import { AuditService } from './audit.service';

describe(AuditService.name, () => {
  let sut: AuditService;
  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let auditMock: Mocked<IAuditRepository>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let personMock: Mocked<IPersonRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let userMock: Mocked<IUserRepository>;

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    auditMock = newAuditRepositoryMock();
    personMock = newPersonRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();
    sut = new AuditService(accessMock, assetMock, cryptoMock, personMock, auditMock, storageMock, userMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleCleanup', () => {
    it('should delete old audit entries', async () => {
      await expect(sut.handleCleanup()).resolves.toBe(JobStatus.SUCCESS);
      expect(auditMock.removeBefore).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  describe('getDeletes', () => {
    it('should require full sync if the request is older than 100 days', async () => {
      auditMock.getAfter.mockResolvedValue([]);

      const date = new Date(2022, 0, 1);
      await expect(sut.getDeletes(authStub.admin, { after: date, entityType: EntityType.ASSET })).resolves.toEqual({
        needsFullSync: true,
        ids: [],
      });

      expect(auditMock.getAfter).toHaveBeenCalledWith(date, {
        action: DatabaseAction.DELETE,
        ownerId: authStub.admin.user.id,
        entityType: EntityType.ASSET,
      });
    });

    it('should get any new or updated assets and deleted ids', async () => {
      auditMock.getAfter.mockResolvedValue([auditStub.delete]);

      const date = new Date();
      await expect(sut.getDeletes(authStub.admin, { after: date, entityType: EntityType.ASSET })).resolves.toEqual({
        needsFullSync: false,
        ids: ['asset-deleted'],
      });

      expect(auditMock.getAfter).toHaveBeenCalledWith(date, {
        action: DatabaseAction.DELETE,
        ownerId: authStub.admin.user.id,
        entityType: EntityType.ASSET,
      });
    });
  });
});
