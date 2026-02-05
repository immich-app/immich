import { BadRequestException } from '@nestjs/common';
import { debounce } from 'lodash';
import { DateTime } from 'luxon';
import path, { basename, join } from 'node:path';
import { PassThrough, Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import semver from 'semver';
import { serverVersion } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { CacheControl, StorageFolder } from 'src/enum';
import { MaintenanceHealthRepository } from 'src/maintenance/maintenance-health.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { StorageRepository } from 'src/repositories/storage.repository';

export function isValidDatabaseBackupName(filename: string) {
  return filename.match(/^[\d\w-.]+\.sql(?:\.gz)?$/);
}

export function isValidDatabaseRoutineBackupName(filename: string) {
  const oldBackupStyle = filename.match(/^immich-db-backup-\d+\.sql\.gz$/);
  //immich-db-backup-20250729T114018-v1.136.0-pg14.17.sql.gz
  const newBackupStyle = filename.match(/^immich-db-backup-\d{8}T\d{6}-v.*-pg.*\.sql\.gz$/);
  return oldBackupStyle || newBackupStyle;
}

export function isFailedDatabaseBackupName(filename: string) {
  return filename.match(/^immich-db-backup-.*\.sql\.gz\.tmp$/);
}

export function findVersion(filename: string) {
  return /-v(.*)-/.exec(filename)?.[1];
}

type BackupRepos = {
  logger: LoggingRepository;
  storage: StorageRepository;
  config: ConfigRepository;
  process: ProcessRepository;
  database: DatabaseRepository;
  health: MaintenanceHealthRepository;
};

export class UnsupportedPostgresError extends Error {
  constructor(databaseVersion: string) {
    super(`Unsupported PostgreSQL version: ${databaseVersion}`);
  }
}

export async function buildPostgresLaunchArguments(
  { logger, config, database }: Pick<BackupRepos, 'logger' | 'config' | 'database'>,
  bin: 'pg_dump' | 'pg_dumpall' | 'psql',
  options: {
    singleTransaction?: boolean;
    username?: string;
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
  } = config.getEnv();
  const isUrlConnection = databaseConfig.connectionType === 'url';

  const databaseVersion = await database.getPostgresVersion();
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

    args.push('--username', databaseUsername, '--host', databaseConfig.host, '--port', databaseConfig.port.toString());

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
    logger.error(`Database Restore Failure: Unsupported PostgreSQL version: ${databaseVersion}`);
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

export async function createDatabaseBackup(
  { logger, storage, process: processRepository, ...pgRepos }: Omit<BackupRepos, 'health'>,
  filenamePrefix: string = '',
): Promise<string> {
  logger.debug(`Database Backup Started`);

  const { bin, args, databasePassword, databaseVersion, databaseMajorVersion } = await buildPostgresLaunchArguments(
    { logger, ...pgRepos },
    'pg_dump',
  );

  logger.log(`Database Backup Starting. Database Version: ${databaseMajorVersion}`);

  const filename = `${filenamePrefix}immich-db-backup-${DateTime.now().toFormat("yyyyLLdd'T'HHmmss")}-v${serverVersion.toString()}-pg${databaseVersion.split(' ')[0]}.sql.gz`;
  const backupFilePath = join(StorageCore.getBaseFolder(StorageFolder.Backups), filename);
  const temporaryFilePath = `${backupFilePath}.tmp`;

  try {
    const pgdump = processRepository.spawnDuplexStream(bin, args, {
      env: {
        PATH: process.env.PATH,
        PGPASSWORD: databasePassword,
      },
    });

    const gzip = processRepository.spawnDuplexStream('gzip', ['--rsyncable']);
    const fileStream = storage.createWriteStream(temporaryFilePath);

    await pipeline(pgdump, gzip, fileStream);
    await storage.rename(temporaryFilePath, backupFilePath);
  } catch (error) {
    logger.error(`Database Backup Failure: ${error}`);
    await storage
      .unlink(temporaryFilePath)
      .catch((error) => logger.error(`Failed to delete failed backup file: ${error}`));
    throw error;
  }

  logger.log(`Database Backup Success`);
  return backupFilePath;
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

export async function restoreDatabaseBackup(
  { logger, storage, process: processRepository, database: databaseRepository, health, ...pgRepos }: BackupRepos,
  filename: string,
  progressCb?: (action: 'backup' | 'restore' | 'migrations' | 'rollback', progress: number) => void,
): Promise<void> {
  logger.debug(`Database Restore Started`);

  let complete = false;
  try {
    if (!isValidDatabaseBackupName(filename)) {
      throw new Error('Invalid backup file format!');
    }

    const backupFilePath = path.join(StorageCore.getBaseFolder(StorageFolder.Backups), filename);
    await storage.stat(backupFilePath); // => check file exists

    let isPgClusterDump = false;
    const version = findVersion(filename);
    if (version && semver.satisfies(version, '<= 2.4')) {
      isPgClusterDump = true;
    }

    const { bin, args, databaseUsername, databasePassword, databaseMajorVersion } = await buildPostgresLaunchArguments(
      { logger, database: databaseRepository, ...pgRepos },
      'psql',
      {
        singleTransaction: !isPgClusterDump,
      },
    );

    progressCb?.('backup', 0.05);

    const restorePointFilePath = await createDatabaseBackup(
      { logger, storage, process: processRepository, database: databaseRepository, ...pgRepos },
      'restore-point-',
    );

    logger.log(`Database Restore Starting. Database Version: ${databaseMajorVersion}`);

    let inputStream: Readable;
    if (backupFilePath.endsWith('.gz')) {
      const fileStream = storage.createPlainReadStream(backupFilePath);
      const gunzip = storage.createGunzip();
      fileStream.pipe(gunzip);
      inputStream = gunzip;
    } else {
      inputStream = storage.createPlainReadStream(backupFilePath);
    }

    const sqlStream = Readable.from(sql(inputStream, databaseUsername, isPgClusterDump));
    const psql = processRepository.spawnDuplexStream(bin, args, {
      env: {
        PATH: process.env.PATH,
        PGPASSWORD: databasePassword,
      },
    });

    const [progressSource, progressSink] = createSqlProgressStreams((progress) => {
      if (complete) {
        return;
      }

      logger.log(`Restore progress ~ ${(progress * 100).toFixed(2)}%`);
      progressCb?.('restore', progress);
    });

    await pipeline(sqlStream, progressSource, psql, progressSink);

    try {
      progressCb?.('migrations', 0.9);
      await databaseRepository.runMigrations();
      await health.checkApiHealth();
    } catch (error) {
      progressCb?.('rollback', 0);

      const fileStream = storage.createPlainReadStream(restorePointFilePath);
      const gunzip = storage.createGunzip();
      fileStream.pipe(gunzip);
      inputStream = gunzip;

      const sqlStream = Readable.from(sqlRollback(inputStream, databaseUsername));
      const psql = processRepository.spawnDuplexStream(bin, args, {
        env: {
          PATH: process.env.PATH,
          PGPASSWORD: databasePassword,
        },
      });

      const [progressSource, progressSink] = createSqlProgressStreams((progress) => {
        if (complete) {
          return;
        }

        logger.log(`Rollback progress ~ ${(progress * 100).toFixed(2)}%`);
        progressCb?.('rollback', progress);
      });

      await pipeline(sqlStream, progressSource, psql, progressSink);

      throw error;
    }
  } catch (error) {
    logger.error(`Database Restore Failure: ${error}`);
    throw error;
  } finally {
    complete = true;
  }

  logger.log(`Database Restore Success`);
}

export async function deleteDatabaseBackup({ storage }: Pick<BackupRepos, 'storage'>, files: string[]): Promise<void> {
  const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);

  if (files.some((filename) => !isValidDatabaseBackupName(filename))) {
    throw new BadRequestException('Invalid backup name!');
  }

  await Promise.all(files.map((filename) => storage.unlink(path.join(backupsFolder, filename))));
}

export async function listDatabaseBackups({
  storage,
}: Pick<BackupRepos, 'storage'>): Promise<{ filename: string; filesize: number }[]> {
  const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
  const files = await storage.readdir(backupsFolder);

  const validFiles = files
    .filter((fn) => isValidDatabaseBackupName(fn))
    .toSorted((a, b) => (a.startsWith('uploaded-') === b.startsWith('uploaded-') ? a.localeCompare(b) : 1))
    .toReversed();

  const backups = await Promise.all(
    validFiles.map(async (filename) => {
      const stats = await storage.stat(path.join(backupsFolder, filename));
      return { filename, filesize: stats.size };
    }),
  );

  return backups;
}

export async function uploadDatabaseBackup(
  { storage }: Pick<BackupRepos, 'storage'>,
  file: Express.Multer.File,
): Promise<void> {
  const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
  const fn = basename(file.originalname);
  if (!isValidDatabaseBackupName(fn)) {
    throw new BadRequestException('Invalid backup name!');
  }

  const path = join(backupsFolder, `uploaded-${fn}`);
  await storage.createOrOverwriteFile(path, file.buffer);
}

export function downloadDatabaseBackup(fileName: string) {
  if (!isValidDatabaseBackupName(fileName)) {
    throw new BadRequestException('Invalid backup name!');
  }

  const path = join(StorageCore.getBaseFolder(StorageFolder.Backups), fileName);

  return {
    path,
    fileName,
    cacheControl: CacheControl.PrivateWithoutCache,
    contentType: fileName.endsWith('.gz') ? 'application/gzip' : 'application/sql',
  };
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
