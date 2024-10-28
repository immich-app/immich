import { PassThrough } from 'node:stream';
import { defaults, SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { ImmichWorker, StorageFolder } from 'src/enum';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { IJobRepository, JobStatus } from 'src/interfaces/job.interface';
import { IProcessRepository } from 'src/interfaces/process.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { BackupService } from 'src/services/backup.service';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { mockSpawn, newTestService } from 'test/utils';
import { describe, Mocked } from 'vitest';

describe(BackupService.name, () => {
  let sut: BackupService;

  let storageMock: Mocked<IStorageRepository>;
  let databaseMock: Mocked<IDatabaseRepository>;
  let jobMock: Mocked<IJobRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let processMock: Mocked<IProcessRepository>;

  beforeEach(() => {
    ({ sut, databaseMock, jobMock, storageMock, systemMock, processMock } = newTestService(BackupService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrapEvent', () => {
    it('should init cron job and handle config changes', async () => {
      databaseMock.tryLock.mockResolvedValue(true);
      systemMock.get.mockResolvedValue(systemConfigStub.backupEnabled);

      await sut.onBootstrap(ImmichWorker.API);

      expect(jobMock.addCronJob).toHaveBeenCalled();
      expect(systemMock.get).toHaveBeenCalled();

      sut.onConfigUpdate({
        oldConfig: defaults,
        newConfig: {
          backup: {
            database: {
              enabled: true,
              cronExpression: '0 1 * * *',
            },
          },
        } as SystemConfig,
      });

      expect(jobMock.updateCronJob).toHaveBeenCalledWith('backupDatabase', '0 1 * * *', true);
    });

    it('should not initialize backup database cron job when lock is taken', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.backupEnabled);
      databaseMock.tryLock.mockResolvedValue(false);

      await sut.onBootstrap(ImmichWorker.API);

      expect(jobMock.addCronJob).not.toHaveBeenCalled();
    });

    it('should not initialise backup database job when running on microservices', async () => {
      await sut.onBootstrap(ImmichWorker.MICROSERVICES);

      expect(jobMock.addCronJob).not.toHaveBeenCalled();
    });
  });

  describe('onConfigUpdateEvent', () => {
    beforeEach(async () => {
      systemMock.get.mockResolvedValue(defaults);
      databaseMock.tryLock.mockResolvedValue(true);
      await sut.onBootstrap(ImmichWorker.API);
    });

    it('should do nothing if oldConfig is not provided', () => {
      sut.onConfigUpdate({ newConfig: systemConfigStub.backupEnabled as SystemConfig });
      expect(jobMock.updateCronJob).not.toHaveBeenCalled();
    });

    it('should do nothing if instance does not have the backup database lock', async () => {
      databaseMock.tryLock.mockResolvedValue(false);
      await sut.onBootstrap(ImmichWorker.API);
      sut.onConfigUpdate({ newConfig: systemConfigStub.backupEnabled as SystemConfig, oldConfig: defaults });
      expect(jobMock.updateCronJob).not.toHaveBeenCalled();
    });
  });

  describe('onConfigValidateEvent', () => {
    it('should allow a valid cron expression', () => {
      expect(() =>
        sut.onConfigValidate({
          newConfig: { backup: { database: { cronExpression: '0 0 * * *' } } } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).not.toThrow(expect.stringContaining('Invalid cron expression'));
    });

    it('should fail for an invalid cron expression', () => {
      expect(() =>
        sut.onConfigValidate({
          newConfig: { backup: { database: { cronExpression: 'foo' } } } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).toThrow(/Invalid cron expression.*/);
    });
  });

  describe('cleanupDatabaseBackups', () => {
    it('should do nothing if not reached keepLastAmount', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.backupEnabled);
      storageMock.readdir.mockResolvedValue(['immich-db-backup-1.sql.gz']);
      await sut.cleanupDatabaseBackups();
      expect(storageMock.unlink).not.toHaveBeenCalled();
    });

    it('should remove failed backup files', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.backupEnabled);
      storageMock.readdir.mockResolvedValue([
        'immich-db-backup-123.sql.gz.tmp',
        'immich-db-backup-234.sql.gz',
        'immich-db-backup-345.sql.gz.tmp',
      ]);
      await sut.cleanupDatabaseBackups();
      expect(storageMock.unlink).toHaveBeenCalledTimes(2);
      expect(storageMock.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-123.sql.gz.tmp`,
      );
      expect(storageMock.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-345.sql.gz.tmp`,
      );
    });

    it('should remove old backup files over keepLastAmount', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.backupEnabled);
      storageMock.readdir.mockResolvedValue(['immich-db-backup-1.sql.gz', 'immich-db-backup-2.sql.gz']);
      await sut.cleanupDatabaseBackups();
      expect(storageMock.unlink).toHaveBeenCalledTimes(1);
      expect(storageMock.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-1.sql.gz`,
      );
    });

    it('should remove old backup files over keepLastAmount and failed backups', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.backupEnabled);
      storageMock.readdir.mockResolvedValue([
        'immich-db-backup-1.sql.gz.tmp',
        'immich-db-backup-2.sql.gz',
        'immich-db-backup-3.sql.gz',
      ]);
      await sut.cleanupDatabaseBackups();
      expect(storageMock.unlink).toHaveBeenCalledTimes(2);
      expect(storageMock.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-1.sql.gz.tmp`,
      );
      expect(storageMock.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-2.sql.gz`,
      );
    });
  });

  describe('handleBackupDatabase', () => {
    beforeEach(() => {
      storageMock.readdir.mockResolvedValue([]);
      processMock.spawn.mockReturnValue(mockSpawn(0, 'data', ''));
      storageMock.rename.mockResolvedValue();
      systemMock.get.mockResolvedValue(systemConfigStub.backupEnabled);
      storageMock.createWriteStream.mockReturnValue(new PassThrough());
    });
    it('should run a database backup successfully', async () => {
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.SUCCESS);
      expect(storageMock.createWriteStream).toHaveBeenCalled();
    });
    it('should rename file on success', async () => {
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.SUCCESS);
      expect(storageMock.rename).toHaveBeenCalled();
    });
    it('should fail if pg_dumpall fails', async () => {
      processMock.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
    });
    it('should not rename file if pgdump fails and gzip succeeds', async () => {
      processMock.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
      expect(storageMock.rename).not.toHaveBeenCalled();
    });
    it('should fail if gzip fails', async () => {
      processMock.spawn.mockReturnValueOnce(mockSpawn(0, 'data', ''));
      processMock.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
    });
    it('should fail if write stream fails', async () => {
      storageMock.createWriteStream.mockImplementation(() => {
        throw new Error('error');
      });
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
    });
    it('should fail if rename fails', async () => {
      storageMock.rename.mockRejectedValue(new Error('error'));
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
    });
  });
});
