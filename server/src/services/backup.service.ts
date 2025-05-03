import { Injectable } from '@nestjs/common';
import path from 'node:path';
import semver from 'semver';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName, StorageFolder } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { handlePromiseError } from 'src/utils/misc';

@Injectable()
export class BackupService extends BaseService {
  private backupLock = false;

  @OnEvent({ name: 'config.init', workers: [ImmichWorker.MICROSERVICES] })
  async onConfigInit({
    newConfig: {
      backup: { database },
    },
  }: ArgOf<'config.init'>) {
    this.backupLock = await this.databaseRepository.tryLock(DatabaseLock.BackupDatabase);

    if (this.backupLock) {
      this.cronRepository.create({
        name: 'backupDatabase',
        expression: database.cronExpression,
        onTick: () => handlePromiseError(this.jobRepository.queue({ name: JobName.BACKUP_DATABASE }), this.logger),
        start: database.enabled,
      });
    }
  }

  @OnEvent({ name: 'config.update', server: true })
  onConfigUpdate({ newConfig: { backup } }: ArgOf<'config.update'>) {
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
    const {
      backup: { database: config },
    } = await this.getConfig({ withCache: false });

    const backupsFolder = StorageCore.getBaseFolder(StorageFolder.BACKUPS);
    const files = await this.storageRepository.readdir(backupsFolder);
    const failedBackups = files.filter((file) => file.match(/immich-db-backup-\d+\.sql\.gz\.tmp$/));
    const backups = files
      .filter((file) => file.match(/immich-db-backup-\d+\.sql\.gz$/))
      .sort()
      .reverse();

    const toDelete = backups.slice(config.keepLastAmount);
    toDelete.push(...failedBackups);

    for (const file of toDelete) {
      await this.storageRepository.unlink(path.join(backupsFolder, file));
    }
    this.logger.debug(`Database Backup Cleanup Finished, deleted ${toDelete.length} backups`);
  }

  @OnJob({ name: JobName.BACKUP_DATABASE, queue: QueueName.BACKUP_DATABASE })
  async handleBackupDatabase(): Promise<JobStatus> {
    this.logger.debug(`Database Backup Started`);
    const { database } = this.configRepository.getEnv();
    const config = database.config;

    const isUrlConnection = config.connectionType === 'url';

    const databaseParams = isUrlConnection
      ? ['--dbname', config.url]
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

    const backupFilePath = path.join(
      StorageCore.getBaseFolder(StorageFolder.BACKUPS),
      `immich-db-backup-${Date.now()}.sql.gz.tmp`,
    );

    const databaseVersion = await this.databaseRepository.getPostgresVersion();
    const databaseSemver = semver.coerce(databaseVersion);
    const databaseMajorVersion = databaseSemver?.major;

    if (!databaseMajorVersion || !databaseSemver || !semver.satisfies(databaseSemver, '>=14.0.0 <18.0.0')) {
      this.logger.error(`Database Backup Failure: Unsupported PostgreSQL version: ${databaseVersion}`);
      return JobStatus.FAILED;
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
              PGPASSWORD: isUrlConnection ? undefined : config.password,
            },
          },
        );

        // NOTE: `--rsyncable` is only supported in GNU gzip
        const gzip = this.processRepository.spawn(`gzip`, ['--rsyncable']);
        pgdump.stdout.pipe(gzip.stdin);

        const fileStream = this.storageRepository.createWriteStream(backupFilePath);

        gzip.stdout.pipe(fileStream);

        pgdump.on('error', (err) => {
          this.logger.error('Backup failed with error', err);
          reject(err);
        });

        gzip.on('error', (err) => {
          this.logger.error('Gzip failed with error', err);
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
      this.logger.error('Database Backup Failure', error);
      await this.storageRepository
        .unlink(backupFilePath)
        .catch((error) => this.logger.error('Failed to delete failed backup file', error));
      throw error;
    }

    this.logger.log(`Database Backup Success`);
    await this.cleanupDatabaseBackups();
    return JobStatus.SUCCESS;
  }
}
