import { DatabaseAction, EntityType } from '@app/infra/entities';
import { IAccessRepositoryMock, auditStub, authStub, newAccessRepositoryMock, newAuditRepositoryMock } from '@test';
import { IAuditRepository } from '../repositories';
import { AuditService } from './audit.service';

describe(AuditService.name, () => {
  let sut: AuditService;
  let accessMock: IAccessRepositoryMock;
  let auditMock: jest.Mocked<IAuditRepository>;

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    auditMock = newAuditRepositoryMock();
    sut = new AuditService(accessMock, auditMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleCleanup', () => {
    it('should delete old audit entries', async () => {
      await expect(sut.handleCleanup()).resolves.toBe(true);
      expect(auditMock.removeBefore).toBeCalledWith(expect.any(Date));
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
        ownerId: authStub.admin.id,
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
        ownerId: authStub.admin.id,
        entityType: EntityType.ASSET,
      });
    });
  });
});
