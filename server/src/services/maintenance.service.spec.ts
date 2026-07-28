import { MaintenanceAction, SystemMetadataKey } from 'src/enum';
import { MaintenanceService } from 'src/services/maintenance.service';
import { mockEnvData } from 'test/repositories/config.repository.mock';
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
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: '',
        action: { action: MaintenanceAction.Start },
      });

      await expect(sut.getMaintenanceMode()).resolves.toEqual({
        isMaintenanceMode: true,
        secret: '',
        action: {
          action: 'start',
        },
      });

      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });
  });

  describe('integrityCheck', () => {
    it('generate integrity report', async () => {
      mocks.storage.readdir.mockResolvedValue(['.immich', 'file1', 'file2']);
      mocks.storage.readFile.mockResolvedValue(undefined as never);
      mocks.storage.overwriteFile.mockRejectedValue(undefined as never);

      await expect(sut.detectPriorInstall()).resolves.toMatchInlineSnapshot(`
        {
          "storage": [
            {
              "files": 2,
              "folder": "encoded-video",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "library",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "upload",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "profile",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "thumbs",
              "readable": true,
              "writable": false,
            },
            {
              "files": 2,
              "folder": "backups",
              "readable": true,
              "writable": false,
            },
          ],
        }
      `);
    });
  });

  describe('startMaintenance', () => {
    it('should set maintenance mode and return a secret', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });

      await expect(
        sut.startMaintenance(
          {
            action: MaintenanceAction.Start,
          },
          'admin',
        ),
      ).resolves.toMatchObject({
        jwt: expect.any(String),
      });

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.MaintenanceMode, {
        isMaintenanceMode: true,
        secret: expect.stringMatching(/^\w{128}$/),
        action: {
          action: 'start',
        },
      });

      expect(mocks.event.emit).toHaveBeenCalledWith('AppRestart', {
        isMaintenanceMode: true,
      });
    });
  });

  describe('startRestoreFlow', () => {
    it('should fail if setup is disabled', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ setup: { allow: false } }));
      mocks.user.hasAdmin.mockResolvedValue(false);

      await expect(sut.startRestoreFlow()).rejects.toThrowError('Admin setup is not available');

      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should fail if the server already has an admin', async () => {
      mocks.user.hasAdmin.mockResolvedValue(true);

      await expect(sut.startRestoreFlow()).rejects.toThrowError('Admin setup is not available');

      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
      expect(mocks.event.emit).not.toHaveBeenCalled();
    });

    it('should start maintenance mode and return a jwt', async () => {
      mocks.user.hasAdmin.mockResolvedValue(false);
      mocks.systemMetadata.get.mockResolvedValue({ isMaintenanceMode: false });

      await expect(sut.startRestoreFlow()).resolves.toMatchObject({ jwt: expect.any(String) });

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.MaintenanceMode, {
        isMaintenanceMode: true,
        secret: expect.stringMatching(/^\w{128}$/),
        action: {
          action: MaintenanceAction.SelectDatabaseRestore,
        },
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
      mocks.systemMetadata.get.mockResolvedValue({
        isMaintenanceMode: true,
        secret: 'secret',
        action: {
          action: MaintenanceAction.Start,
        },
      });

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
