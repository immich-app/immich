import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { StorageCore } from 'src/cores/storage.core';
import { StorageFolder } from 'src/enum';
import { DatabaseBackupService } from 'src/services/database-backup.service';
import { MaintenanceService } from 'src/services/maintenance.service';
import { newTestService, ServiceMocks } from 'test/utils';

describe(MaintenanceService.name, () => {
  let sut: DatabaseBackupService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(DatabaseBackupService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

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
      await sut.deleteBackup(['filename']);
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

  describe('downloadBackup', () => {
    it('should reject invalid file names', () => {
      expect(() => sut.downloadBackup('invalid backup')).toThrowError(new BadRequestException('Invalid backup name!'));
    });

    it('should get backup path', () => {
      expect(sut.downloadBackup('hello.sql.gz')).toEqual(
        expect.objectContaining({
          path: '/data/backups/hello.sql.gz',
        }),
      );
    });
  });
});
