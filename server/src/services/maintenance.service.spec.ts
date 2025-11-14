import { SystemMetadataKey } from 'src/enum';
import { MaintenanceService } from 'src/services/maintenance.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(MaintenanceService.name, () => {
  let sut: MaintenanceService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MaintenanceService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getMaintenanceMode', () => {
    it('should return false if state unknown', async () => {
      mocks.systemMetadata.get.mockResolvedValue(null);

      await expect(sut.getMaintenanceMode()).resolves.toEqual({
        isMaintenanceMode: false,
      });

      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should return false if disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });

      await expect(sut.getMaintenanceMode()).resolves.toEqual({
        isMaintenanceMode: false,
      });

      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should return true if enabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: true, secret: '' });

      await expect(sut.getMaintenanceMode()).resolves.toEqual({
        isMaintenanceMode: true,
        secret: '',
      });

      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });
  });

  describe('startMaintenance', () => {
    it('should set maintenance mode and return a secret', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });

      await expect(sut.startMaintenance('admin')).resolves.toMatchObject({
        jwt: expect.any(String),
      });

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.MaintenanceMode, {
        isMaintenanceMode: true,
        secret: expect.stringMatching(/^\w{128}$/),
      });

      expect(mocks.event.emit).toHaveBeenCalledWith('AppRestart', {
        isMaintenanceMode: true,
      });
    });
  });

  describe('createLoginUrl', () => {
    it('should fail outside of maintenance mode without secret', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });

      await expect(
        sut.createLoginUrl({
          username: '',
        }),
      ).rejects.toThrowError('Not in maintenance mode');
    });

    it('should generate a login url with JWT', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: true, secret: 'secret' });

      await expect(
        sut.createLoginUrl({
          username: '',
        }),
      ).resolves.toEqual(
        expect.stringMatching(
          /^https:\/\/my.immich.app\/maintenance\?token=[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$/,
        ),
      );

      expect(mocks.systemMetadata.get).toHaveBeenCalledTimes(2);
    });

    it('should use the given secret', async () => {
      await expect(
        sut.createLoginUrl(
          {
            username: '',
          },
          'secret',
        ),
      ).resolves.toEqual(expect.stringMatching(/./));

      expect(mocks.systemMetadata.get).toHaveBeenCalledTimes(1);
    });
  });
});
