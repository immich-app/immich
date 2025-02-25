import { SystemMetadataKey } from 'src/enum';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(SystemMetadataService.name, () => {
  let sut: SystemMetadataService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SystemMetadataService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAdminOnboarding', () => {
    it('should get isOnboarded state', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isOnboarded: true });
      await expect(sut.getAdminOnboarding()).resolves.toEqual({ isOnboarded: true });
      expect(mocks.systemMetadata.get).toHaveBeenCalledWith('admin-onboarding');
    });

    it('should default isOnboarded to false', async () => {
      await expect(sut.getAdminOnboarding()).resolves.toEqual({ isOnboarded: false });
      expect(mocks.systemMetadata.get).toHaveBeenCalledWith('admin-onboarding');
    });
  });

  describe('updateAdminOnboarding', () => {
    it('should update isOnboarded to true', async () => {
      await expect(sut.updateAdminOnboarding({ isOnboarded: true })).resolves.toBeUndefined();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.ADMIN_ONBOARDING, { isOnboarded: true });
    });

    it('should update isOnboarded to false', async () => {
      await expect(sut.updateAdminOnboarding({ isOnboarded: false })).resolves.toBeUndefined();
      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.ADMIN_ONBOARDING, { isOnboarded: false });
    });
  });

  describe('getReverseGeocodingState', () => {
    it('should get reverse geocoding state', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ lastUpdate: '2024-01-01', lastImportFileName: 'foo.bar' });
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
