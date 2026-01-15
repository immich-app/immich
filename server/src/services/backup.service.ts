import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import path from 'node:path';
import semver from 'semver';
import { serverVersion } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName, StorageFolder } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { StorageAdapterFactory } from 'src/repositories/storage';
import { BaseService } from 'src/services/base.service';
import { handlePromiseError } from 'src/utils/misc';

@Injectable()
export class BackupService extends BaseService {
  private backupLock = false;
  private storageAdapterFactory = new StorageAdapterFactory();

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit({
    newConfig: {
      backup: { database },
    },
  }: ArgOf<'ConfigInit'>) {
    this.backupLock = await this.databaseRepository.tryLock(DatabaseLock.BackupDatabase);

    if (this.backupLock) {
      this.cronRepository.create({
        name: 'backupDatabase',
        expression: database.cronExpression,
        onTick: () => handlePromiseError(this.jobRepository.queue({ name: JobName.DatabaseBackup }), this.logger),
        start: database.enabled,
      });
    }
  }

  @OnEvent({ name: 'ConfigUpdate', server: true })
  onConfigUpdate({ newConfig: { backup } }: ArgOf<'ConfigUpdate'>) {
    if (!this.backupLock) {
      return;
    }

    this.cronRepository.update({
      name: 'backupDatabase',
      expression: backup.database.cronExpression,
      start: backup.database.enabled,
    });
  }

  async cleanupDatabaseBackups() {
    this.logger.debug(`Database Backup Cleanup Started`);
    const appConfig = await this.getConfig({ withCache: false });
    const config = appConfig.backup.database;

    // Clean up local backups
    const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
    const files = await this.storageRepository.readdir(backupsFolder);
    const failedBackups = files.filter((file) => file.match(/immich-db-backup-.*\.sql\.gz\.tmp$/));
    const backups = files
      .filter((file) => {
        const oldBackupStyle = file.match(/immich-db-backup-\d+\.sql\.gz$/);
        //immich-db-backup-20250729T114018-v1.136.0-pg14.17.sql.gz
        const newBackupStyle = file.match(/immich-db-backup-\d{8}T\d{6}-v.*-pg.*\.sql\.gz$/);
        return oldBackupStyle || newBackupStyle;
      })
      .toSorted()
      .toReversed();

    const toDelete = backups.slice(config.keepLastAmount);
    toDelete.push(...failedBackups);

    for (const file of toDelete) {
      await this.storageRepository.unlink(path.join(backupsFolder, file));
    }
    this.logger.debug(`Database Backup Cleanup Finished, deleted ${toDelete.length} local backups`);

    // Clean up S3 backups if enabled
    if (config.uploadToS3 && appConfig.storage.s3.enabled) {
      await this.cleanupS3DatabaseBackups(appConfig, config.keepLastAmount);
    }
  }

  /**
   * Clean up old database backups from S3.
   */
  private async cleanupS3DatabaseBackups(config: Awaited<ReturnType<typeof this.getConfig>>, keepLastAmount: number): Promise<void> {
    try {
      const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);
      const s3Objects = await s3Adapter.listObjects('backups/database/');

      // Filter for backup files and sort by last modified (newest first)
      const backupObjects = s3Objects
        .filter((obj) => {
          const filename = obj.key.split('/').pop() || '';
          const oldBackupStyle = filename.match(/immich-db-backup-\d+\.sql\.gz$/);
          const newBackupStyle = filename.match(/immich-db-backup-\d{8}T\d{6}-v.*-pg.*\.sql\.gz$/);
          return oldBackupStyle || newBackupStyle;
        })
        .toSorted((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

      const s3ToDelete = backupObjects.slice(keepLastAmount);

      for (const obj of s3ToDelete) {
        await s3Adapter.delete(obj.key);
        this.logger.debug(`Deleted S3 backup: ${obj.key}`);
      }

      this.logger.debug(`S3 Database Backup Cleanup Finished, deleted ${s3ToDelete.length} backups`);
    } catch (error) {
      this.logger.error(`Failed to cleanup S3 database backups: ${error}`);
      // Don't throw - cleanup failure shouldn't fail the backup job
    }
  }

  @OnJob({ name: JobName.DatabaseBackup, queue: QueueName.BackupDatabase })
  async handleBackupDatabase(): Promise<JobStatus> {
    this.logger.debug(`Database Backup Started`);
    const { database } = this.configRepository.getEnv();
    const config = database.config;

    const isUrlConnection = config.connectionType === 'url';

    let connectionUrl: string = isUrlConnection ? config.url : '';
    if (URL.canParse(connectionUrl)) {
      // remove known bad url parameters for pg_dumpall
      const url = new URL(connectionUrl);
      url.searchParams.delete('uselibpqcompat');
      connectionUrl = url.toString();
    }

    const databaseParams = isUrlConnection
      ? ['--dbname', connectionUrl]
      : [
          '--username',
          config.username,
          '--host',
          config.host,
          '--port',
          `${config.port}`,
          '--database',
          config.database,
        ];

    databaseParams.push('--clean', '--if-exists');
    const databaseVersion = await this.databaseRepository.getPostgresVersion();
    const backupFilePath = path.join(
      StorageCore.getBaseFolder(StorageFolder.Backups),
      `immich-db-backup-${DateTime.now().toFormat("yyyyLLdd'T'HHmmss")}-v${serverVersion.toString()}-pg${databaseVersion.split(' ')[0]}.sql.gz.tmp`,
    );
    const databaseSemver = semver.coerce(databaseVersion);
    const databaseMajorVersion = databaseSemver?.major;

    if (!databaseMajorVersion || !databaseSemver || !semver.satisfies(databaseSemver, '>=14.0.0 <19.0.0')) {
      this.logger.error(`Database Backup Failure: Unsupported PostgreSQL version: ${databaseVersion}`);
      return JobStatus.Failed;
    }

    this.logger.log(`Database Backup Starting. Database Version: ${databaseMajorVersion}`);

    try {
      await new Promise<void>((resolve, reject) => {
        const pgdump = this.processRepository.spawn(
          `/usr/lib/postgresql/${databaseMajorVersion}/bin/pg_dumpall`,
          databaseParams,
          {
            env: {
              PATH: process.env.PATH,
              PGPASSWORD: isUrlConnection ? new URL(connectionUrl).password : config.password,
            },
          },
        );

        // NOTE: `--rsyncable` is only supported in GNU gzip
        const gzip = this.processRepository.spawn(`gzip`, ['--rsyncable']);
        pgdump.stdout.pipe(gzip.stdin);

        const fileStream = this.storageRepository.createWriteStream(backupFilePath);

        gzip.stdout.pipe(fileStream);

        pgdump.on('error', (err) => {
          this.logger.error(`Backup failed with error: ${err}`);
          reject(err);
        });

        gzip.on('error', (err) => {
          this.logger.error(`Gzip failed with error: ${err}`);
          reject(err);
        });

        let pgdumpLogs = '';
        let gzipLogs = '';

        pgdump.stderr.on('data', (data) => (pgdumpLogs += data));
        gzip.stderr.on('data', (data) => (gzipLogs += data));

        pgdump.on('exit', (code) => {
          if (code !== 0) {
            this.logger.error(`Backup failed with code ${code}`);
            reject(`Backup failed with code ${code}`);
            this.logger.error(pgdumpLogs);
            return;
          }
          if (pgdumpLogs) {
            this.logger.debug(`pgdump_all logs\n${pgdumpLogs}`);
          }
        });

        gzip.on('exit', (code) => {
          if (code !== 0) {
            this.logger.error(`Gzip failed with code ${code}`);
            reject(`Gzip failed with code ${code}`);
            this.logger.error(gzipLogs);
            return;
          }
          if (pgdump.exitCode !== 0) {
            this.logger.error(`Gzip exited with code 0 but pgdump exited with ${pgdump.exitCode}`);
            return;
          }
          resolve();
        });
      });
      await this.storageRepository.rename(backupFilePath, backupFilePath.replace('.tmp', ''));
    } catch (error) {
      this.logger.error(`Database Backup Failure: ${error}`);
      await this.storageRepository
        .unlink(backupFilePath)
        .catch((error) => this.logger.error(`Failed to delete failed backup file: ${error}`));
      throw error;
    }

    this.logger.log(`Database Backup Success`);

    // Upload to S3 if enabled
    const appConfig = await this.getConfig({ withCache: false });
    if (appConfig.backup.database.uploadToS3 && appConfig.storage.s3.enabled) {
      await this.uploadBackupToS3(backupFilePath.replace('.tmp', ''), appConfig);
    }

    await this.cleanupDatabaseBackups();
    return JobStatus.Success;
  }

  /**
   * Upload a database backup file to S3.
   */
  private async uploadBackupToS3(localBackupPath: string, config: Awaited<ReturnType<typeof this.getConfig>>): Promise<void> {
    try {
      const s3Adapter = this.storageAdapterFactory.getS3Adapter(config.storage.s3);
      const filename = path.basename(localBackupPath);
      const s3Key = `backups/database/${filename}`;

      this.logger.log(`Uploading database backup to S3: ${s3Key}`);

      // Read the backup file and upload to S3
      const fileBuffer = await this.storageRepository.readFile(localBackupPath);
      await s3Adapter.write(s3Key, fileBuffer, {
        contentType: 'application/gzip',
        storageClass: 'STANDARD_IA', // Infrequent access - backups aren't accessed often
      });

      this.logger.log(`Database backup uploaded to S3 successfully: ${s3Key}`);
    } catch (error) {
      this.logger.error(`Failed to upload database backup to S3: ${error}`);
      // Don't throw - S3 upload failure shouldn't fail the entire backup job
      // The local backup is still available
    }
  }
}
