import { PassThrough } from 'node:stream';
import { defaults, SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { ImmichWorker, StorageFolder } from 'src/enum';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { JobStatus } from 'src/interfaces/job.interface';
import { IProcessRepository } from 'src/interfaces/process.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { BackupService } from 'src/services/backup.service';
import { IConfigRepository, ICronRepository } from 'src/types';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { mockSpawn, newTestService } from 'test/utils';
import { describe, Mocked } from 'vitest';

describe(BackupService.name, () => {
  let sut: BackupService;

  let databaseMock: Mocked<IDatabaseRepository>;
  let configMock: Mocked<IConfigRepository>;
  let cronMock: Mocked<ICronRepository>;
  let processMock: Mocked<IProcessRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, cronMock, configMock, databaseMock, processMock, storageMock, systemMock } = newTestService(BackupService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrapEvent', () => {
    it('should init cron job and handle config changes', async () => {
      databaseMock.tryLock.mockResolvedValue(true);

      await sut.onConfigInit({ newConfig: systemConfigStub.backupEnabled as SystemConfig });

      expect(cronMock.create).toHaveBeenCalled();
    });

    it('should not initialize backup database cron job when lock is taken', async () => {
      databaseMock.tryLock.mockResolvedValue(false);

      await sut.onConfigInit({ newConfig: systemConfigStub.backupEnabled as SystemConfig });

      expect(cronMock.create).not.toHaveBeenCalled();
    });

    it('should not initialise backup database job when running on microservices', async () => {
      configMock.getWorker.mockReturnValue(ImmichWorker.MICROSERVICES);
      await sut.onConfigInit({ newConfig: systemConfigStub.backupEnabled as SystemConfig });

      expect(cronMock.create).not.toHaveBeenCalled();
    });
  });

  describe('onConfigUpdateEvent', () => {
    beforeEach(async () => {
      databaseMock.tryLock.mockResolvedValue(true);
      await sut.onConfigInit({ newConfig: defaults });
    });

    it('should update cron job if backup is enabled', () => {
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

      expect(cronMock.update).toHaveBeenCalledWith({ name: 'backupDatabase', expression: '0 1 * * *', start: true });
      expect(cronMock.update).toHaveBeenCalled();
    });

    it('should do nothing if instance does not have the backup database lock', async () => {
      databaseMock.tryLock.mockResolvedValue(false);
      await sut.onConfigInit({ newConfig: defaults });
      sut.onConfigUpdate({ newConfig: systemConfigStub.backupEnabled as SystemConfig, oldConfig: defaults });
      expect(cronMock.update).not.toHaveBeenCalled();
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
      storageMock.unlink.mockResolvedValue();
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
    it('should ignore unlink failing and still return failed job status', async () => {
      processMock.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      storageMock.unlink.mockRejectedValue(new Error('error'));
      const result = await sut.handleBackupDatabase();
      expect(storageMock.unlink).toHaveBeenCalled();
      expect(result).toBe(JobStatus.FAILED);
    });
    it.each`
      postgresVersion                       | expectedVersion
      ${'14.10'}                            | ${14}
      ${'14.10.3'}                          | ${14}
      ${'14.10 (Debian 14.10-1.pgdg120+1)'} | ${14}
      ${'15.3.3'}                           | ${15}
      ${'16.4.2'}                           | ${16}
      ${'17.15.1'}                          | ${17}
    `(
      `should use pg_dumpall $expectedVersion with postgres version $postgresVersion`,
      async ({ postgresVersion, expectedVersion }) => {
        databaseMock.getPostgresVersion.mockResolvedValue(postgresVersion);
        await sut.handleBackupDatabase();
        expect(processMock.spawn).toHaveBeenCalledWith(
          `/usr/lib/postgresql/${expectedVersion}/bin/pg_dumpall`,
          expect.any(Array),
          expect.any(Object),
        );
      },
    );
    it.each`
      postgresVersion
      ${'13.99.99'}
      ${'18.0.0'}
    `(`should fail if postgres version $postgresVersion is not supported`, async ({ postgresVersion }) => {
      databaseMock.getPostgresVersion.mockResolvedValue(postgresVersion);
      const result = await sut.handleBackupDatabase();
      expect(processMock.spawn).not.toHaveBeenCalled();
      expect(result).toBe(JobStatus.FAILED);
    });
  });
});
