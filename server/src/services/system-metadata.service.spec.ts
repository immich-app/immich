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

  describe('getAdminOnboarding', () => {
    it('should get isOnboarded state', async () => {
      systemMock.get.mockResolvedValue({ isOnboarded: true });
      await expect(sut.getAdminOnboarding()).resolves.toEqual({ isOnboarded: true });
      expect(systemMock.get).toHaveBeenCalledWith('admin-onboarding');
    });

    it('should default isOnboarded to false', async () => {
      await expect(sut.getAdminOnboarding()).resolves.toEqual({ isOnboarded: false });
      expect(systemMock.get).toHaveBeenCalledWith('admin-onboarding');
    });
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

  describe('getReverseGeocodingState', () => {
    it('should get reverse geocoding state', async () => {
      systemMock.get.mockResolvedValue({ lastUpdate: '2024-01-01', lastImportFileName: 'foo.bar' });
      await expect(sut.getReverseGeocodingState()).resolves.toEqual({
        lastUpdate: '2024-01-01',
        lastImportFileName: 'foo.bar',
      });
    });

    it('should default reverse geocoding state to null', async () => {
      await expect(sut.getReverseGeocodingState()).resolves.toEqual({
        lastUpdate: null,
        lastImportFileName: null,
      });
    });
  });
});
