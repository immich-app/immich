import { DateTime } from 'luxon';
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
      mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
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
      //`immich-db-backup-${DateTime.now().toFormat("yyyyLLdd'T'HHmmss")}-v${serverVersion.toString()}-pg${databaseVersion.split(' ')[0]}.sql.gz.tmp`,
      mocks.storage.readdir.mockResolvedValue([
        'immich-db-backup-123.sql.gz.tmp',
        `immich-db-backup-${DateTime.fromISO('2025-07-25T11:02:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz.tmp`,
        `immich-db-backup-${DateTime.fromISO('2025-07-27T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
        `immich-db-backup-${DateTime.fromISO('2025-07-29T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz.tmp`,
      ]);
      await sut.cleanupDatabaseBackups();
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(3);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.Backups)}/immich-db-backup-123.sql.gz.tmp`,
      );
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.Backups)}/immich-db-backup-20250725T110216-v1.234.5-pg14.5.sql.gz.tmp`,
      );
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.Backups)}/immich-db-backup-20250729T110116-v1.234.5-pg14.5.sql.gz.tmp`,
      );
    });

    it('should remove old backup files over keepLastAmount', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.backupEnabled);
      mocks.storage.readdir.mockResolvedValue(['immich-db-backup-1.sql.gz', 'immich-db-backup-2.sql.gz']);
      await sut.cleanupDatabaseBackups();
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.Backups)}/immich-db-backup-1.sql.gz`,
      );
    });

    it('should remove old backup files over keepLastAmount and failed backups', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.backupEnabled);
      mocks.storage.readdir.mockResolvedValue([
        `immich-db-backup-${DateTime.fromISO('2025-07-25T11:02:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz.tmp`,
        `immich-db-backup-${DateTime.fromISO('2025-07-27T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
        'immich-db-backup-1753789649000.sql.gz',
        `immich-db-backup-${DateTime.fromISO('2025-07-29T11:01:16Z').toFormat("yyyyLLdd'T'HHmmss")}-v1.234.5-pg14.5.sql.gz`,
      ]);
      await sut.cleanupDatabaseBackups();
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(3);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.Backups)}/immich-db-backup-1753789649000.sql.gz`,
      );
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.Backups)}/immich-db-backup-20250725T110216-v1.234.5-pg14.5.sql.gz.tmp`,
      );
      expect(mocks.storage.unlink).toHaveBeenCalledWith(
        `${StorageCore.getBaseFolder(StorageFolder.Backups)}/immich-db-backup-20250727T110116-v1.234.5-pg14.5.sql.gz`,
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

    it('should sanitize DB_URL (remove uselibpqcompat) before calling pg_dumpall', async () => {
      // create a service instance with a URL connection that includes libpqcompat
      const dbUrl = 'postgresql://postgres:pwd@host:5432/immich?sslmode=require&uselibpqcompat=true';
      const configMock = {
        getEnv: () => ({ database: { config: { connectionType: 'url', url: dbUrl }, skipMigrations: false } }),
        getWorker: () => ImmichWorker.Api,
        isDev: () => false,
      } as unknown as any;

      ({ sut, mocks } = newTestService(BackupService, { config: configMock }));

      mocks.storage.readdir.mockResolvedValue([]);
      mocks.process.spawn.mockReturnValue(mockSpawn(0, 'data', ''));
      mocks.storage.rename.mockResolvedValue();
      mocks.storage.unlink.mockResolvedValue();
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.backupEnabled);
      mocks.storage.createWriteStream.mockReturnValue(new PassThrough());
      mocks.database.getPostgresVersion.mockResolvedValue('14.10');

      await sut.handleBackupDatabase();

      expect(mocks.process.spawn).toHaveBeenCalled();
      const call = mocks.process.spawn.mock.calls[0];
      const args = call[1] as string[];
      // ['--dbname', '<url>', '--clean', '--if-exists']
      expect(args[0]).toBe('--dbname');
      const passedUrl = args[1];
      expect(passedUrl).not.toContain('uselibpqcompat');
      expect(passedUrl).toContain('sslmode=require');
    });

    it('should run a database backup successfully', async () => {
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.Success);
      expect(mocks.storage.createWriteStream).toHaveBeenCalled();
    });

    it('should rename file on success', async () => {
      const result = await sut.handleBackupDatabase();
      expect(result).toBe(JobStatus.Success);
      expect(mocks.storage.rename).toHaveBeenCalled();
    });

    it('should fail if pg_dumpall fails', async () => {
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      await expect(sut.handleBackupDatabase()).rejects.toThrow('Backup failed with code 1');
    });

    it('should not rename file if pgdump fails and gzip succeeds', async () => {
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      await expect(sut.handleBackupDatabase()).rejects.toThrow('Backup failed with code 1');
      expect(mocks.storage.rename).not.toHaveBeenCalled();
    });

    it('should fail if gzip fails', async () => {
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(0, 'data', ''));
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      await expect(sut.handleBackupDatabase()).rejects.toThrow('Gzip failed with code 1');
    });

    it('should fail if write stream fails', async () => {
      mocks.storage.createWriteStream.mockImplementation(() => {
        throw new Error('error');
      });
      await expect(sut.handleBackupDatabase()).rejects.toThrow('error');
    });

    it('should fail if rename fails', async () => {
      mocks.storage.rename.mockRejectedValue(new Error('error'));
      await expect(sut.handleBackupDatabase()).rejects.toThrow('error');
    });

    it('should ignore unlink failing and still return failed job status', async () => {
      mocks.process.spawn.mockReturnValueOnce(mockSpawn(1, '', 'error'));
      mocks.storage.unlink.mockRejectedValue(new Error('error'));
      await expect(sut.handleBackupDatabase()).rejects.toThrow('Backup failed with code 1');
      expect(mocks.storage.unlink).toHaveBeenCalled();
    });

    it.each`
      postgresVersion                       | expectedVersion
      ${'14.10'}                            | ${14}
      ${'14.10.3'}                          | ${14}
      ${'14.10 (Debian 14.10-1.pgdg120+1)'} | ${14}
      ${'15.3.3'}                           | ${15}
      ${'16.4.2'}                           | ${16}
      ${'17.15.1'}                          | ${17}
      ${'18.0.0'}                           | ${18}
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
      ${'19.0.0'}
    `(`should fail if postgres version $postgresVersion is not supported`, async ({ postgresVersion }) => {
      mocks.database.getPostgresVersion.mockResolvedValue(postgresVersion);
      const result = await sut.handleBackupDatabase();
      expect(mocks.process.spawn).not.toHaveBeenCalled();
      expect(result).toBe(JobStatus.Failed);
    });
  });
});
