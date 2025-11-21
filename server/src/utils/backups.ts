import { BadRequestException } from '@nestjs/common';
import { debounce } from 'lodash';
import { DateTime } from 'luxon';
import { stat, writeFile } from 'node:fs/promises';
import path, { join } from 'node:path';
import { PassThrough, Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import semver from 'semver';
import { serverVersion } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { StorageFolder } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { StorageRepository } from 'src/repositories/storage.repository';

export function isValidBackupName(filename: string) {
  return filename.match(/^[\d\w-.]+\.sql(?:\.gz)?$/);
}

export function isValidRoutineBackupName(filename: string) {
  const oldBackupStyle = filename.match(/^immich-db-backup-\d+\.sql\.gz$/);
  //immich-db-backup-20250729T114018-v1.136.0-pg14.17.sql.gz
  const newBackupStyle = filename.match(/^immich-db-backup-\d{8}T\d{6}-v.*-pg.*\.sql\.gz$/);
  return oldBackupStyle || newBackupStyle;
}

export function isFailedBackupName(filename: string) {
  return filename.match(/^immich-db-backup-.*\.sql\.gz\.tmp$/);
}

type BackupRepos = {
  logger: LoggingRepository;
  storage: StorageRepository;
  config: ConfigRepository;
  process: ProcessRepository;
  database: DatabaseRepository;
};

export class UnsupportedPostgresError extends Error {
  constructor(databaseVersion: string) {
    super(`Unsupported PostgreSQL version: ${databaseVersion}`);
  }
}

export async function buildPostgresLaunchArguments(
  { logger, config, database }: Pick<BackupRepos, 'logger' | 'config' | 'database'>,
  bin: 'pg_dump' | 'pg_dumpall' | 'psql',
): Promise<{
  bin: string;
  args: string[];
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

  if (isUrlConnection) {
    if (bin !== 'pg_dump') {
      args.push('--dbname');
    }

    args.push(databaseConfig.url);
  } else {
    args.push(
      '--username',
      databaseConfig.username,
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
      args.push(
        // don't commit any transaction on failure
        '--single-transaction',
        // exit with non-zero code on error
        '--set',
        'ON_ERROR_STOP=on',
        // used for progress monitoring
        '--echo-all',
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
    databasePassword: isUrlConnection ? new URL(databaseConfig.url).password : databaseConfig.password,
    databaseVersion,
    databaseMajorVersion,
  };
}

export async function createBackup(
  { logger, storage, process: processRepository, ...pgRepos }: BackupRepos,
  filenamePrefix: string = '',
): Promise<void> {
  logger.debug(`Database Backup Started`);

  const { bin, args, databasePassword, databaseVersion, databaseMajorVersion } = await buildPostgresLaunchArguments(
    { logger, ...pgRepos },
    'pg_dump',
  );

  logger.log(`Database Backup Starting. Database Version: ${databaseMajorVersion}`);

  const backupFilePath = join(
    StorageCore.getBaseFolder(StorageFolder.Backups),
    `${filenamePrefix}immich-db-backup-${DateTime.now().toFormat("yyyyLLdd'T'HHmmss")}-v${serverVersion.toString()}-pg${databaseVersion.split(' ')[0]}.sql.gz.tmp`,
  );

  try {
    const pgdump = processRepository.createSpawnDuplexStream(bin, args, {
      env: {
        PATH: process.env.PATH,
        PGPASSWORD: databasePassword,
      },
    });

    const gzip = processRepository.createSpawnDuplexStream('gzip', ['--rsyncable']);
    const fileStream = storage.createWriteStream(backupFilePath);

    await pipeline(pgdump, gzip, fileStream);
    await storage.rename(backupFilePath, backupFilePath.replace('.tmp', ''));
  } catch (error) {
    logger.error(`Database Backup Failure: ${error}`);
    await storage
      .unlink(backupFilePath)
      .catch((error) => logger.error(`Failed to delete failed backup file: ${error}`));
    throw error;
  }

  logger.log(`Database Backup Success`);
}

export async function restoreBackup(
  { logger, storage, process: processRepository, ...pgRepos }: BackupRepos,
  filename: string,
  progressCb?: (action: 'backup' | 'restore', progress: number) => void,
): Promise<void> {
  logger.debug(`Database Restore Started`);

  let complete = false;
  try {
    if (!isValidBackupName(filename)) {
      throw new Error('Invalid backup file format!');
    }

    const backupFilePath = path.join(StorageCore.getBaseFolder(StorageFolder.Backups), filename);
    await storage.stat(backupFilePath); // => check file exists

    const { bin, args, databasePassword, databaseMajorVersion } = await buildPostgresLaunchArguments(
      { logger, ...pgRepos },
      'psql',
    );

    progressCb?.('backup', 0.05);

    await createBackup({ logger, storage, process: processRepository, ...pgRepos }, 'restore-point-');

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

    async function* sql() {
      yield `
        -- drop all other database connections
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid();

        -- re-create the default schema
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;

        -- restore access to schema
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `;

      for await (const chunk of inputStream) {
        yield chunk;
      }
    }

    const sqlStream = Readable.from(sql());
    const psql = processRepository.createSpawnDuplexStream(bin, args, {
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
  } catch (error) {
    logger.error(`Database Restore Failure: ${error}`);
    throw error;
  } finally {
    complete = true;
  }

  logger.log(`Database Restore Success`);
}

export async function deleteBackup({ storage }: Pick<BackupRepos, 'storage'>, filename: string): Promise<void> {
  const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
  await storage.unlink(path.join(backupsFolder, filename));
}

export async function listBackups({ storage }: Pick<BackupRepos, 'storage'>): Promise<string[]> {
  const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
  const files = await storage.readdir(backupsFolder);
  return files
    .filter((fn) => isValidBackupName(fn))
    .sort((a, b) => (a.startsWith('uploaded-') === b.startsWith('uploaded-') ? a.localeCompare(b) : 1))
    .toReversed();
}

export async function uploadBackup(file: Express.Multer.File): Promise<void> {
  const backupsFolder = StorageCore.getBaseFolder(StorageFolder.Backups);
  const fn = file.originalname;
  if (!isValidBackupName(fn)) {
    throw new BadRequestException('Not a valid backup name!');
  }

  const path = join(backupsFolder, `uploaded-${fn}`);

  try {
    await stat(path);
    throw new BadRequestException('File already exists!');
  } catch {
    await writeFile(path, file.buffer);
  }
}

function createSqlProgressStreams(cb: (progress: number) => void) {
  const STDIN_START_MARKER = new TextEncoder().encode('FROM stdin');
  const STDIN_END_MARKER = new TextEncoder().encode(String.raw`\.`);

  let readingStdin = false;
  let sequenceIdx = 0;

  let bytesSent = 0;
  let bytesProcessed = 0;

  const startedAt = +Date.now();
  const cbDebounced = debounce(
    () => {
      const progress = source.writableEnded
        ? Math.max(1, bytesProcessed / bytesSent)
        : // progress simulation while we're in an indeterminate state
          Math.min(0.3, 0.1 + (Date.now() - startedAt) / 1e4);
      cb(progress);
    },
    100,
    {
      maxWait: 200,
    },
  );

  const source = new PassThrough({
    transform(chunk, _encoding, callback) {
      for (const byte of chunk) {
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

      if (!readingStdin) {
        bytesSent += chunk.length;
        cbDebounced();
      }

      this.push(chunk);
      callback();
    },
  });

  const sink = new Writable({
    write(chunk, _encoding, callback) {
      bytesProcessed += chunk.length;
      callback();
    },
  });

  return [source, sink];
}
