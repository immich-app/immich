import { DatabaseAction, EntityType } from 'src/enum';
import { IAuditRepository } from 'src/interfaces/audit.interface';
import { JobStatus } from 'src/interfaces/job.interface';
import { AuditService } from 'src/services/audit.service';
import { auditStub } from 'test/fixtures/audit.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(AuditService.name, () => {
  let sut: AuditService;
  let auditMock: Mocked<IAuditRepository>;

  beforeEach(() => {
    ({ sut, auditMock } = newTestService(AuditService));
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
