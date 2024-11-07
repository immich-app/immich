import { Injectable } from '@nestjs/common';
import { default as path } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { ImmichWorker, StorageFolder } from 'src/enum';
import { DatabaseLock } from 'src/interfaces/database.interface';
import { ArgOf } from 'src/interfaces/event.interface';
import { JobName, JobStatus, QueueName } from 'src/interfaces/job.interface';
import { BaseService } from 'src/services/base.service';
import { handlePromiseError } from 'src/utils/misc';
import { validateCronExpression } from 'src/validation';

@Injectable()
export class BackupService extends BaseService {
  private backupLock = false;

  @OnEvent({ name: 'config.init' })
  async onConfigInit({
    newConfig: {
      backup: { database },
    },
  }: ArgOf<'config.init'>) {
    if (this.worker !== ImmichWorker.API) {
      return;
    }

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

  @OnEvent({ name: 'config.validate' })
  onConfigValidate({ newConfig }: ArgOf<'config.validate'>) {
    const { database } = newConfig.backup;
    if (!validateCronExpression(database.cronExpression)) {
      throw new Error(`Invalid cron expression ${database.cronExpression}`);
    }
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

    const {
      database: { config },
    } = this.configRepository.getEnv();

    const isUrlConnection = config.connectionType === 'url';
    const databaseParams = isUrlConnection ? ['-d', config.url] : ['-U', config.username, '-h', config.host];
    const backupFilePath = path.join(
      StorageCore.getBaseFolder(StorageFolder.BACKUPS),
      `immich-db-backup-${Date.now()}.sql.gz.tmp`,
    );

    try {
      await new Promise<void>((resolve, reject) => {
        const pgdump = this.processRepository.spawn(`pg_dumpall`, [...databaseParams, '--clean', '--if-exists'], {
          env: { PATH: process.env.PATH, PGPASSWORD: isUrlConnection ? undefined : config.password },
        });

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
      return JobStatus.FAILED;
    }

    this.logger.debug(`Database Backup Success`);
    await this.cleanupDatabaseBackups();
    return JobStatus.SUCCESS;
  }
}
