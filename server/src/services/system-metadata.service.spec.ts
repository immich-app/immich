import { SystemMetadataKey } from 'src/enum';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(SystemMetadataService.name, () => {
  let sut: SystemMetadataService;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, systemMock } = newTestService(SystemMetadataService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('updateAdminOnboarding', () => {
    it('should update isOnboarded to true', async () => {
      await expect(sut.updateAdminOnboarding({ isOnboarded: true })).resolves.toBeUndefined();
      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.ADMIN_ONBOARDING, { isOnboarded: true });
    });

    it('should update isOnboarded to false', async () => {
      await expect(sut.updateAdminOnboarding({ isOnboarded: false })).resolves.toBeUndefined();
      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.ADMIN_ONBOARDING, { isOnboarded: false });
    });
  });
});
