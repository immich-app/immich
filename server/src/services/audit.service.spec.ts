import { JobStatus } from 'src/enum';
import { AuditService } from 'src/services/audit.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(AuditService.name, () => {
  let sut: AuditService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AuditService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleCleanup', () => {
    it('should delete old audit entries', async () => {
      mocks.audit.removeBefore.mockResolvedValue();

      await expect(sut.handleCleanup()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.audit.removeBefore).toHaveBeenCalledWith(expect.any(Date));
    });
  });
});
