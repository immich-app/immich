import { PassThrough } from 'node:stream';
import { defaults, SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { ImmichWorker, JobStatus, StorageFolder } from 'src/enum';
import { BackupService } from 'src/services/backup.service';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { mockSpawn, newTestService, ServiceMocks } from 'test/utils';
import { describe } from 'vitest';

describe(BackupService.name, () => {
  let sut: BackupService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(BackupService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrapEvent', () => {
    it('should init cron job and handle config changes', async () => {
      mocks.database.tryLock.mockResolvedValue(true);
      mocks.cron.create.mockResolvedValue();

      await sut.onConfigInit({ newConfig: systemConfigStub.backupEnabled as SystemConfig });

      expect(mocks.cron.create).toHaveBeenCalled();
    });

    it('should not initialize backup database cron job when lock is taken', async () => {
      mocks.database.tryLock.mockResolvedValue(false);

      await sut.onConfigInit({ newConfig: systemConfigStub.backupEnabled as SystemConfig });

      expect(mocks.cron.create).not.toHaveBeenCalled();
    });

    it('should not initialise backup database job when running on microservices', async () => {
      mocks.config.getWorker.mockReturnValue(ImmichWorker.MICROSERVICES);
      await sut.onConfigInit({ newConfig: systemConfigStub.backupEnabled as SystemConfig });

      expect(mocks.cron.create).not.toHaveBeenCalled();
    });
  });

  describe('onConfigUpdateEvent', () => {
    beforeEach(async () => {
      mocks.database.tryLock.mockResolvedValue(true);
      mocks.cron.create.mockResolvedValue();

      await sut.onConfigInit({ newConfig: defaults });
    });

    it('should update cron job if backup is enabled', () => {
      mocks.cron.update.mockResolvedValue();

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

      expect(mocks.cron.update).toHaveBeenCalledWith({ name: 'backupDatabase', expression: '0 1 * * *', start: true });
      expect(mocks.cron.update).toHaveBeenCalled();
    });

    it('should do nothing if instance does not have the backup database lock', async () => {
      mocks.database.tryLock.mockResolvedValue(false);
      await sut.onConfigInit({ newConfig: defaults });
      sut.onConfigUpdate({ newConfig: systemConfigStub.backupEnabled as SystemConfig, oldConfig: defaults });
      expect(mocks.cron.update).not.toHaveBeenCalled();
    });
  });

  describe('cleanupDatabaseBackups', () => {
    it('should do nothing if not reached keepLastAmount', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.backupEnabled);
      mocks.storage.readdir.mockResolvedValue(['immich-db-backup-1.sql.gz']);
      await sut.cleanupDatabaseBackups();
      expect(mocks.storage.unlink).not.toHaveBeenCalled();
    });

    it('should remove failed backup files', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.backupEnabled);
      mocks.storage.readdir.mockResolvedValue([
        'immich-db-backup-123.sql.gz.tmp',
        'immich-db-backup-234.sql.gz',
        'immich-db-backup-345.sql.gz.tmp',
      ]);
      await sut.cleanupDatabaseBackups();
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(2);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-123.sql.gz.tmp`,
      );
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-345.sql.gz.tmp`,
      );
    });

    it('should remove old backup files over keepLastAmount', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.backupEnabled);
      mocks.storage.readdir.mockResolvedValue(['immich-db-backup-1.sql.gz', 'immich-db-backup-2.sql.gz']);
      await sut.cleanupDatabaseBackups();
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-1.sql.gz`,
      );
    });

    it('should remove old backup files over keepLastAmount and failed backups', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.backupEnabled);
      mocks.storage.readdir.mockResolvedValue([
        'immich-db-backup-1.sql.gz.tmp',
        'immich-db-backup-2.sql.gz',
        'immich-db-backup-3.sql.gz',
      ]);
      await sut.cleanupDatabaseBackups();
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(2);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-1.sql.gz.tmp`,
      );
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.BACKUPS)}/immich-db-backup-2.sql.gz`,
      );
    });
  });

  describe('handleBackupDatabase', () => {
    beforeEach(() => {
      mocks.storage.readdir.mockResolvedValue([]);
      mocks.process.spawn.mockReturnValue(mockSpawn(0, 'data', ''));
      mocks.storage.rename.mockResolvedValue();
      mocks.storage.unlink.mockResolvedValue();
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.backupEnabled);
      mocks.storage.createWriteStream.mockReturnValue(new PassThrough());
    });
    it('should run a database backup successfully', async () => {
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.SUCCESS);
      expect(mocks.storage.createWriteStream).toHaveBeenCalled();
    });
    it('should rename file on success', async () => {
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.SUCCESS);
      expect(mocks.storage.rename).toHaveBeenCalled();
    });
    it('should fail if pg_dumpall fails', async () => {
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
    });
    it('should not rename file if pgdump fails and gzip succeeds', async () => {
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
      expect(mocks.storage.rename).not.toHaveBeenCalled();
    });
    it('should fail if gzip fails', async () => {
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(0, 'data', ''));
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
    });
    it('should fail if write stream fails', async () => {
      mocks.storage.createWriteStream.mockImplementation(() => {
        throw new Error('error');
      });
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
    });
    it('should fail if rename fails', async () => {
      mocks.storage.rename.mockRejectedValue(new Error('error'));
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.FAILED);
    });
    it('should ignore unlink failing and still return failed job status', async () => {
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      mocks.storage.unlink.mockRejectedValue(new Error('error'));
      const result = await sut.handleBackupDatabase();
      expect(mocks.storage.unlink).toHaveBeenCalled();
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
        mocks.database.getPostgresVersion.mockResolvedValue(postgresVersion);
        await sut.handleBackupDatabase();
        expect(mocks.process.spawn).toHaveBeenCalledWith(
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
      mocks.database.getPostgresVersion.mockResolvedValue(postgresVersion);
      const result = await sut.handleBackupDatabase();
      expect(mocks.process.spawn).not.toHaveBeenCalled();
      expect(result).toBe(JobStatus.FAILED);
    });
  });
});
