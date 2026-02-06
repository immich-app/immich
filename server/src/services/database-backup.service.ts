import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { debounce } from 'lodash';
import { DateTime } from 'luxon';
import path, { basename } from 'node:path';
import { PassThrough, Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import semver from 'semver';
import { serverVersion } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { DatabaseBackupListResponseDto } from 'src/dtos/database-backup.dto';
import { CacheControl, DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName, StorageFolder } from 'src/enum';
import { MaintenanceHealthRepository } from 'src/maintenance/maintenance-health.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CronRepository } from 'src/repositories/cron.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { getConfig } from 'src/utils/config';
import {
  findDatabaseBackupVersion,
  isFailedDatabaseBackupName,
  isValidDatabaseBackupName,
  isValidDatabaseRoutineBackupName,
  UnsupportedPostgresError,
} from 'src/utils/database-backups';
import { ImmichFileResponse } from 'src/utils/file';
import { handlePromiseError } from 'src/utils/misc';

@Injectable()
export class DatabaseBackupService {
  constructor(
    private readonly logger: LoggingRepository,
    private readonly storageRepository: StorageRepository,
    private readonly configRepository: ConfigRepository,
    private readonly systemMetadataRepository: SystemMetadataRepository,
    private readonly processRepository: ProcessRepository,
    private readonly databaseRepository: DatabaseRepository,
    @Optional()
    private readonly cronRepository: CronRepository,
    @Optional()
    private readonly jobRepository: JobRepository,
    @Optional()
    private readonly maintenanceHealthRepository: MaintenanceHealthRepository,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  private backupLock = false;

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit({
    newConfig: {
      backup: { database },
    },
  }: ArgOf<'ConfigInit'>) {
    if (!this.cronRepository || !this.jobRepository) {
      return;
    }

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
    if (!this.cronRepository || !this.jobRepository || !this.backupLock) {
      return;
    }

    this.cronRepository.update({
      name: 'backupDatabase',
      expression: backup.database.cronExpression,
      start: backup.database.enabled,
    });
  }

  @OnJob({ name: JobName.DatabaseBackup, queue: QueueName.BackupDatabase })
  async handleBackupDatabase(): Promise<JobStatus> {
    try {
      await this.createDatabaseBackup();
    } catch (error) {
      if (error instanceof UnsupportedPostgresError) {
        return JobStatus.Failed;
      }

      throw error;
    }

    await this.cleanupDatabaseBackups();
    return JobStatus.Success;
  }

  async buildPostgresLaunchArguments(
    bin: 'pg_dump' | 'pg_dumpall' | 'psql',
    options: {
      singleTransaction?: boolean;
    } = {},
  ): Promise<{
    bin: string;
    args: string[];
    databaseUsername: string;
    databasePassword: string;
    databaseVersion: string;
    databaseMajorVersion?: number;
  }> {
    const {
      database: { config: databaseConfig },
    } = this.configRepository.getEnv();
    const isUrlConnection = databaseConfig.connectionType === 'url';

    const databaseVersion = await this.databaseRepository.getPostgresVersion();
    const databaseSemver = semver.coerce(databaseVersion);
    const databaseMajorVersion = databaseSemver?.major;

    const args: string[] = [];
    let databaseUsername;

    if (isUrlConnection) {
      if (bin !== 'pg_dump') {
        args.push('--dbname');
      }

      let url = databaseConfig.url;
      if (URL.canParse(databaseConfig.url)) {
        const parsedUrl = new URL(databaseConfig.url);
        // remove known bad parameters
        parsedUrl.searchParams.delete('uselibpqcompat');

        databaseUsername = parsedUrl.username;
        url = parsedUrl.toString();
      }

      // assume typical values if we can't parse URL or not present
      databaseUsername ??= 'postgres';

      args.push(url);
    } else {
      databaseUsername = databaseConfig.username;

      args.push(
        '--username',
        databaseUsername,
        '--host',
        databaseConfig.host,
        '--port',
        databaseConfig.port.toString(),
      );

      switch (bin) {
        case 'pg_dumpall': {
          args.push('--database');
          break;
        }
        case 'psql': {
          args.push('--dbname');
          break;
        }
      }

      args.push(databaseConfig.database);
    }

    switch (bin) {
      case 'pg_dump':
      case 'pg_dumpall': {
        args.push('--clean', '--if-exists');
        break;
      }
      case 'psql': {
        if (options.singleTransaction) {
          args.push(
            // don't commit any transaction on failure
            '--single-transaction',
            // exit with non-zero code on error
            '--set',
            'ON_ERROR_STOP=on',
          );
        }

        args.push(
          // used for progress monitoring
          '--echo-all',
          '--output=/dev/null',
        );
        break;
      }
    }

    if (!databaseMajorVersion || !databaseSemver || !semver.satisfies(databaseSemver, '>=14.0.0 <19.0.0')) {
      this.logger.error(`Database Restore Failure: Unsupported PostgreSQL version: ${databaseVersion}`);
      throw new UnsupportedPostgresError(databaseVersion);
    }

    return {
      bin: `/usr/lib/postgresql/${databaseMajorVersion}/bin/${bin}`,
      args,
      databaseUsername,
      databasePassword: isUrlConnection ? new URL(databaseConfig.url).password : databaseConfig.password,
      databaseVersion,
      databaseMajorVersion,
    };
  }

  async createDatabaseBackup(filenamePrefix: string = ''): Promise<string> {
    this.logger.debug(`Database Backup Started`);

    const { bin, args, databasePassword, databaseVersion, databaseMajorVersion } =
      await this.buildPostgresLaunchArguments('pg_dump');

    this.logger.log(`Database Backup Starting. Database Version: ${databaseMajorVersion}`);

    const filename = `${filenamePrefix}immich-db-backup-${DateTime.now().toFormat("yyyyLLdd'T'HHmmss")}-v${serverVersion.toString()}-pg${databaseVersion.split(' ')[0]}.sql.gz`;
    const backupFilePath = path.join(StorageCore.getBaseFolder(StorageFolder.Backups), filename);
    const temporaryFilePath = `${backupFilePath}.tmp`;

    try {
      const pgdump = this.processRepository.spawnDuplexStream(bin, args, {
        env: {
          PATH: process.env.PATH,
          PGPASSWORD: databasePassword,
        },
      });

      const gzip = this.processRepository.spawnDuplexStream('gzip', ['--rsyncable']);
      const fileStream = this.storageRepository.createWriteStream(temporaryFilePath);

      await pipeline(pgdump, gzip, fileStream);
      await this.storageRepository.rename(temporaryFilePath, backupFilePath);
    } catch (error) {
      this.logger.error(`Database Backup Failure: ${error}`);
      await this.storageRepository
        .unlink(temporaryFilePath)
        .catch((error) => this.logger.error(`Failed to delete failed backup file: ${error}`));
      throw error;
    }

    this.logger.log(`Database Backup Success`);
    return backupFilePath;
  }

  async uploadBackup(file: Express.Multer.File): Promise<void> {
    const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
    const fn = basename(file.originalname);
    if (!isValidDatabaseBackupName(fn)) {
      throw new BadRequestException('Invalid backup name!');
    }

    const filePath = path.join(backupsFolder, `uploaded-${fn}`);
    await this.storageRepository.createOrOverwriteFile(filePath, file.buffer);
  }

  downloadBackup(fileName: string): ImmichFileResponse {
    if (!isValidDatabaseBackupName(fileName)) {
      throw new BadRequestException('Invalid backup name!');
    }

    const filePath = path.join(StorageCore.getBaseFolder(StorageFolder.Backups), fileName);

    return {
      path: filePath,
      fileName,
      cacheControl: CacheControl.PrivateWithoutCache,
      contentType: fileName.endsWith('.gz') ? 'application/gzip' : 'application/sql',
    };
  }

  async listBackups(): Promise<DatabaseBackupListResponseDto> {
    const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
    const files = await this.storageRepository.readdir(backupsFolder);

    const validFiles = files
      .filter((fn) => isValidDatabaseBackupName(fn))
      .toSorted((a, b) => (a.startsWith('uploaded-') === b.startsWith('uploaded-') ? a.localeCompare(b) : 1))
      .toReversed();

    const backups = await Promise.all(
      validFiles.map(async (filename) => {
        const stats = await this.storageRepository.stat(path.join(backupsFolder, filename));
        return { filename, filesize: stats.size };
      }),
    );

    return {
      backups,
    };
  }

  async deleteBackup(files: string[]): Promise<void> {
    const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);

    if (files.some((filename) => !isValidDatabaseBackupName(filename))) {
      throw new BadRequestException('Invalid backup name!');
    }

    await Promise.all(files.map((filename) => this.storageRepository.unlink(path.join(backupsFolder, filename))));
  }

  async cleanupDatabaseBackups() {
    this.logger.debug(`Database Backup Cleanup Started`);
    const {
      backup: { database: config },
    } = await getConfig(
      {
        configRepo: this.configRepository,
        metadataRepo: this.systemMetadataRepository,
        logger: this.logger,
      },
      {
        withCache: false,
      },
    );

    const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
    const files = await this.storageRepository.readdir(backupsFolder);
    const backups = files
      .filter((filename) => isValidDatabaseRoutineBackupName(filename))
      .toSorted()
      .toReversed();
    const failedBackups = files.filter((filename) => isFailedDatabaseBackupName(filename));

    const toDelete = backups.slice(config.keepLastAmount);
    toDelete.push(...failedBackups);

    for (const file of toDelete) {
      await this.storageRepository.unlink(path.join(backupsFolder, file));
    }

    this.logger.debug(`Database Backup Cleanup Finished, deleted ${toDelete.length} backups`);
  }

  async restoreDatabaseBackup(
    filename: string,
    progressCb?: (action: 'backup' | 'restore' | 'migrations' | 'rollback', progress: number) => void,
  ): Promise<void> {
    this.logger.debug(`Database Restore Started`);

    let complete = false;
    try {
      if (!isValidDatabaseBackupName(filename)) {
        throw new Error('Invalid backup file format!');
      }

      const backupFilePath = path.join(StorageCore.getBaseFolder(StorageFolder.Backups), filename);
      await this.storageRepository.stat(backupFilePath); // => check file exists

      let isPgClusterDump = false;
      const version = findDatabaseBackupVersion(filename);
      if (version && semver.satisfies(version, '<= 2.4')) {
        isPgClusterDump = true;
      }

      const { bin, args, databaseUsername, databasePassword, databaseMajorVersion } =
        await this.buildPostgresLaunchArguments('psql', {
          singleTransaction: !isPgClusterDump,
        });

      progressCb?.('backup', 0.05);

      const restorePointFilePath = await this.createDatabaseBackup('restore-point-');

      this.logger.log(`Database Restore Starting. Database Version: ${databaseMajorVersion}`);

      let inputStream: Readable;
      if (backupFilePath.endsWith('.gz')) {
        const fileStream = this.storageRepository.createPlainReadStream(backupFilePath);
        const gunzip = this.storageRepository.createGunzip();
        fileStream.pipe(gunzip);
        inputStream = gunzip;
      } else {
        inputStream = this.storageRepository.createPlainReadStream(backupFilePath);
      }

      const sqlStream = Readable.from(sql(inputStream, databaseUsername, isPgClusterDump));
      const psql = this.processRepository.spawnDuplexStream(bin, args, {
        env: {
          PATH: process.env.PATH,
          PGPASSWORD: databasePassword,
        },
      });

      const [progressSource, progressSink] = createSqlProgressStreams((progress) => {
        if (complete) {
          return;
        }

        this.logger.log(`Restore progress ~ ${(progress * 100).toFixed(2)}%`);
        progressCb?.('restore', progress);
      });

      await pipeline(sqlStream, progressSource, psql, progressSink);

      try {
        progressCb?.('migrations', 0.9);
        await this.databaseRepository.runMigrations();
        await this.maintenanceHealthRepository.checkApiHealth();
      } catch (error) {
        progressCb?.('rollback', 0);

        const fileStream = this.storageRepository.createPlainReadStream(restorePointFilePath);
        const gunzip = this.storageRepository.createGunzip();
        fileStream.pipe(gunzip);
        inputStream = gunzip;

        const sqlStream = Readable.from(sqlRollback(inputStream, databaseUsername));
        const psql = this.processRepository.spawnDuplexStream(bin, args, {
          env: {
            PATH: process.env.PATH,
            PGPASSWORD: databasePassword,
          },
        });

        const [progressSource, progressSink] = createSqlProgressStreams((progress) => {
          if (complete) {
            return;
          }

          this.logger.log(`Rollback progress ~ ${(progress * 100).toFixed(2)}%`);
          progressCb?.('rollback', progress);
        });

        await pipeline(sqlStream, progressSource, psql, progressSink);

        throw error;
      }
    } catch (error) {
      this.logger.error(`Database Restore Failure: ${error}`);
      throw error;
    } finally {
      complete = true;
    }

    this.logger.log(`Database Restore Success`);
  }
}

const SQL_DROP_CONNECTIONS = `
  -- drop all other database connections
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND pid <> pg_backend_pid();
`;

const SQL_RESET_SCHEMA = (username: string) => `
  -- re-create the default schema
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;

  -- restore access to schema
  GRANT ALL ON SCHEMA public TO "${username}";
  GRANT ALL ON SCHEMA public TO public;
`;

async function* sql(inputStream: Readable, databaseUsername: string, isPgClusterDump: boolean) {
  yield SQL_DROP_CONNECTIONS;
  yield isPgClusterDump
    ? // it is likely the dump contains SQL to try to drop the currently active
      // database to ensure we have a fresh slate; if the `postgres` database exists
      // then prefer to switch before continuing otherwise this will just silently fail
      String.raw`
        \c postgres
      `
    : SQL_RESET_SCHEMA(databaseUsername);

  for await (const chunk of inputStream) {
    yield chunk;
  }
}

async function* sqlRollback(inputStream: Readable, databaseUsername: string) {
  yield SQL_DROP_CONNECTIONS;
  yield SQL_RESET_SCHEMA(databaseUsername);

  for await (const chunk of inputStream) {
    yield chunk;
  }
}

function createSqlProgressStreams(cb: (progress: number) => void) {
  const STDIN_START_MARKER = new TextEncoder().encode('FROM stdin');
  const STDIN_END_MARKER = new TextEncoder().encode(String.raw`\.`);

  let readingStdin = false;
  let sequenceIdx = 0;

  let linesSent = 0;
  let linesProcessed = 0;

  const startedAt = +Date.now();
  const cbDebounced = debounce(
    () => {
      const progress = source.writableEnded
        ? Math.min(1, linesProcessed / linesSent)
        : // progress simulation while we're in an indeterminate state
          Math.min(0.3, 0.1 + (Date.now() - startedAt) / 1e4);
      cb(progress);
    },
    100,
    {
      maxWait: 100,
    },
  );

  let lastByte = -1;
  const source = new PassThrough({
    transform(chunk, _encoding, callback) {
      for (const byte of chunk) {
        if (!readingStdin && byte === 10 && lastByte !== 10) {
          linesSent += 1;
        }

        lastByte = byte;

        const sequence = readingStdin ? STDIN_END_MARKER : STDIN_START_MARKER;
        if (sequence[sequenceIdx] === byte) {
          sequenceIdx += 1;

          if (sequence.length === sequenceIdx) {
            sequenceIdx = 0;
            readingStdin = !readingStdin;
          }
        } else {
          sequenceIdx = 0;
        }
      }

      cbDebounced();
      this.push(chunk);
      callback();
    },
  });

  const sink = new Writable({
    write(chunk, _encoding, callback) {
      for (const byte of chunk) {
        if (byte === 10) {
          linesProcessed++;
        }
      }

      cbDebounced();
      callback();
    },
  });

  return [source, sink];
}
