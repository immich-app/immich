import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { StorageCore } from 'src/cores/storage.core';
import { MaintenanceAction, StorageFolder, SystemMetadataKey } from 'src/enum';
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

  /**
   * Backups
   */

  describe('listBackups', () => {
    it('should give us all backups', async () => {
      mocks.storage.readdir.mockResolvedValue([
        `immich-db-backup-${DateTime.fromISO('2025-07-25T11:02:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz.tmp`,
        `immich-db-backup-${DateTime.fromISO('2025-07-27T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
        'immich-db-backup-1753789649000.sql.gz',
        `immich-db-backup-${DateTime.fromISO('2025-07-29T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
      ]);

      await expect(sut.listBackups()).resolves.toMatchObject({
        backups: [
          'immich-db-backup-20250729T110116-v1.234.5-pg14.5.sql.gz',
          'immich-db-backup-20250727T110116-v1.234.5-pg14.5.sql.gz',
          'immich-db-backup-1753789649000.sql.gz',
        ],
      });
    });
  });

  describe('deleteBackup', () => {
    it('should unlink the target file', async () => {
      await sut.deleteBackup('filename');
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(`${StorageCore.getBaseFolder(StorageFolder.Backups)}/filename`);
    });
  });

  describe('uploadBackup', () => {
    it('should reject invalid file names', async () => {
      await expect(sut.uploadBackup({ originalname: 'invalid backup' } as never)).rejects.toThrowError(
        new BadRequestException('Not a valid backup name!'),
      );
    });

    it('should write file', async () => {
      await sut.uploadBackup({ originalname: 'path.sql.gz', buffer: 'buffer' } as never);
      expect(mocks.storage.createOrOverwriteFile).toBeCalledWith('/data/backups/uploaded-path.sql.gz', 'buffer');
    });
  });

  describe('getBackupPath', () => {
    it('should reject invalid file names', () => {
      expect(() => sut.getBackupPath('invalid backup')).toThrowError(new BadRequestException('Invalid backup name!'));
    });

    it('should get backup path', () => {
      expect(sut.getBackupPath('hello.sql.gz')).toEqual('/data/backups/hello.sql.gz');
    });
  });
});
