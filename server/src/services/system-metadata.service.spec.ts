import { SystemMetadataKey } from 'src/entities/system-metadata.entity';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { Mocked } from 'vitest';

describe(SystemMetadataService.name, () => {
  let sut: SystemMetadataService;
  let metadataMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    metadataMock = newSystemMetadataRepositoryMock();
    sut = new SystemMetadataService(metadataMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('updateAdminOnboarding', () => {
    it('should update isOnboarded to true', async () => {
      await expect(sut.updateAdminOnboarding({ isOnboarded: true })).resolves.toBeUndefined();
      expect(metadataMock.set).toHaveBeenCalledWith(SystemMetadataKey.ADMIN_ONBOARDING, { isOnboarded: true });
    });

    it('should update isOnboarded to false', async () => {
      await expect(sut.updateAdminOnboarding({ isOnboarded: false })).resolves.toBeUndefined();
      expect(metadataMock.set).toHaveBeenCalledWith(SystemMetadataKey.ADMIN_ONBOARDING, { isOnboarded: false });
    });
  });
});
