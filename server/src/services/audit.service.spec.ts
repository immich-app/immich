import { DatabaseAction, EntityType } from 'src/entities/audit.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IAuditRepository } from 'src/interfaces/audit.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AuditService } from 'src/services/audit.service';
import { auditStub } from 'test/fixtures/audit.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newAuditRepositoryMock } from 'test/repositories/audit.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newPersonRepositoryMock } from 'test/repositories/person.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { Mocked } from 'vitest';

describe(AuditService.name, () => {
  let sut: AuditService;
  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let auditMock: Mocked<IAuditRepository>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let personMock: Mocked<IPersonRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let userMock: Mocked<IUserRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    auditMock = newAuditRepositoryMock();
    personMock = newPersonRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    sut = new AuditService(accessMock, assetMock, cryptoMock, personMock, auditMock, storageMock, userMock, loggerMock);
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
        userIds: [authStub.admin.user.id],
        entityType: EntityType.ASSET,
      });
    });

    it('should get any new or updated assets and deleted ids', async () => {
      auditMock.getAfter.mockResolvedValue([auditStub.delete.entityId]);

      const date = new Date();
      await expect(sut.getDeletes(authStub.admin, { after: date, entityType: EntityType.ASSET })).resolves.toEqual({
        needsFullSync: false,
        ids: ['asset-deleted'],
      });

      expect(auditMock.getAfter).toHaveBeenCalledWith(date, {
        action: DatabaseAction.DELETE,
        userIds: [authStub.admin.user.id],
        entityType: EntityType.ASSET,
      });
    });
  });
});
