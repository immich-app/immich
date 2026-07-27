import { DateTime } from 'luxon';
import { DatabaseBackupDto } from 'src/dtos/database-backup.dto';

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

export function findDatabaseBackupVersion(filename: string) {
  return /-v(.*)-/.exec(filename)?.[1];
}

function getDatabaseBackupTimestamp(backup: DatabaseBackupDto): number {
  const dateMatch = backup.filename.match(/\d+T\d+/);
  if (!dateMatch) {
    return 0;
  }

  return DateTime.fromFormat(dateMatch[0], "yyyyMMdd'T'HHmmss", { zone: backup.timezone }).toMillis();
}

export function getLatestDatabaseBackup<T extends DatabaseBackupDto>(backups: T[]): T | undefined {
  if (backups.length === 0) {
    return undefined;
  }

  return backups.toSorted((a, b) => getDatabaseBackupTimestamp(b) - getDatabaseBackupTimestamp(a))[0];
}

export class UnsupportedPostgresError extends Error {
  constructor(databaseVersion: string) {
    super(`Unsupported PostgreSQL version: ${databaseVersion}`);
  }
}
