import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import path from 'node:path';
import semver from 'semver';
import { serverVersion } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName, StorageFolder } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { handlePromiseError } from 'src/utils/misc';
import { S3AppStorageBackend } from 'src/storage/s3-backend';

@Injectable()
export class BackupService extends BaseService {
  private backupLock = false;
  // S3 helpers
  private _s3: S3AppStorageBackend | null | undefined;
  private joinPaths(base: string, part: string): string {
    if (base.startsWith('s3://')) {
      const head = base.replace(/\/+$/g, '');
      const tail = part.replace(/^\/+/, '');
      return `${head}/${tail}`;
    }
    return path.join(base, part);
  }
  private getS3(): S3AppStorageBackend | null {
    if (this._s3 !== undefined) return this._s3;
    const env = this.configRepository.getEnv();
    const s3c = env.storage.s3;
    if (env.storage.engine === 's3' && s3c && s3c.bucket) {
      this._s3 = new S3AppStorageBackend({
        endpoint: s3c.endpoint,
        region: s3c.region || 'us-east-1',
        bucket: s3c.bucket,
        prefix: s3c.prefix,
        forcePathStyle: s3c.forcePathStyle,
        useAccelerate: s3c.useAccelerate,
        accessKeyId: s3c.accessKeyId,
        secretAccessKey: s3c.secretAccessKey,
        sse: s3c.sse as any,
        sseKmsKeyId: s3c.sseKmsKeyId,
      });
    } else {
      this._s3 = null;
    }
    return this._s3;
  }

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
    const {
      backup: { database: config },
    } = await this.getConfig({ withCache: false });

    const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
    const s3 = this.getS3();
    let files: string[] = [];
    if (s3 && (backupsFolder.startsWith('s3://') || StorageCore.isImmichPath(backupsFolder))) {
      // List immediate files under the backups prefix on S3
      files = await s3.list(backupsFolder);
    } else {
      files = await this.storageRepository.readdir(backupsFolder);
    }
    const failedBackups = files.filter((file) => file.match(/immich-db-backup-.*\.sql\.gz\.tmp$/));
    const backups = files
      .filter((file) => {
        const oldBackupStyle = file.match(/immich-db-backup-\d+\.sql\.gz$/);
        //immich-db-backup-20250729T114018-v1.136.0-pg14.17.sql.gz
        const newBackupStyle = file.match(/immich-db-backup-\d{8}T\d{6}-v.*-pg.*\.sql\.gz$/);
        return oldBackupStyle || newBackupStyle;
      })
      .sort()
      .toReversed();

    const toDelete = backups.slice(config.keepLastAmount);
    toDelete.push(...failedBackups);

    for (const file of toDelete) {
      const filePath = this.joinPaths(backupsFolder, file);
      if (s3 && (filePath.startsWith('s3://') || StorageCore.isImmichPath(filePath))) {
        await s3.deleteObject(filePath);
      } else {
        await this.storageRepository.unlink(filePath);
      }
    }
    this.logger.debug(`Database Backup Cleanup Finished, deleted ${toDelete.length} backups`);
  }

  @OnJob({ name: JobName.DatabaseBackup, queue: QueueName.BackupDatabase })
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
    const databaseVersion = await this.databaseRepository.getPostgresVersion();
    const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
    const filename = `immich-db-backup-${DateTime.now().toFormat("yyyyLLdd'T'HHmmss")}-v${serverVersion.toString()}-pg${
      databaseVersion.split(' ')[0]
    }.sql.gz`;
    const backupFilePath = this.joinPaths(backupsFolder, `${filename}.tmp`);
    const finalFilePath = this.joinPaths(backupsFolder, filename);
    const databaseSemver = semver.coerce(databaseVersion);
    const databaseMajorVersion = databaseSemver?.major;

    if (!databaseMajorVersion || !databaseSemver || !semver.satisfies(databaseSemver, '>=14.0.0 <18.0.0')) {
      this.logger.error(`Database Backup Failure: Unsupported PostgreSQL version: ${databaseVersion}`);
      return JobStatus.Failed;
    }

    this.logger.log(`Database Backup Starting. Database Version: ${databaseMajorVersion}`);

    try {
      const s3 = this.getS3();
      let s3Finalize: (() => Promise<void>) | null = null;
      await new Promise<void>((resolve, reject) => {
        const pgdump = this.processRepository.spawn(
          `/usr/lib/postgresql/${databaseMajorVersion}/bin/pg_dumpall`,
          databaseParams,
          {
            env: {
              PATH: process.env.PATH,
              PGPASSWORD: isUrlConnection ? new URL(config.url).password : config.password,
            },
          },
        );

        // NOTE: `--rsyncable` is only supported in GNU gzip
        const gzip = this.processRepository.spawn(`gzip`, ['--rsyncable']);
        pgdump.stdout.pipe(gzip.stdin);

        // Select destination stream: local FS or S3
        if (s3 && (backupsFolder.startsWith('s3://') || StorageCore.isImmichPath(backupsFolder))) {
          s3.writeStream(backupFilePath)
            .then(({ stream, done }) => {
              s3Finalize = done;
              gzip.stdout.pipe(stream);
            })
            .catch((err) => {
              this.logger.error(`Failed to start S3 upload stream: ${err}`);
              reject(err);
            });
        } else {
          const fileStream = this.storageRepository.createWriteStream(backupFilePath);
          gzip.stdout.pipe(fileStream);
        }

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
          // Ensure S3 multipart upload has completed
          if (s3Finalize) {
            s3Finalize().then(() => resolve()).catch((err) => reject(err));
          } else {
            resolve();
          }
        });
      });
      // Finalize: rename tmp → final
      const s3w = this.getS3();
      if (s3w && (backupsFolder.startsWith('s3://') || StorageCore.isImmichPath(backupsFolder))) {
        await s3w.copyObject(backupFilePath, finalFilePath);
        await s3w.deleteObject(backupFilePath);
      } else {
        await this.storageRepository.rename(backupFilePath, finalFilePath);
      }
    } catch (error) {
      this.logger.error(`Database Backup Failure: ${error}`);
      const s3 = this.getS3();
      if (s3 && (backupsFolder.startsWith('s3://') || StorageCore.isImmichPath(backupsFolder))) {
        await s3.deleteObject(backupFilePath).catch((err) =>
          this.logger.error(`Failed to delete failed backup object: ${err}`),
        );
      } else {
        await this.storageRepository
          .unlink(backupFilePath)
          .catch((err) => this.logger.error(`Failed to delete failed backup file: ${err}`));
      }
      throw error;
    }

    this.logger.log(`Database Backup Success`);
    await this.cleanupDatabaseBackups();
    return JobStatus.Success;
  }
}
