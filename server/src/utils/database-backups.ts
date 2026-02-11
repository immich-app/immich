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

export class UnsupportedPostgresError extends Error {
  constructor(databaseVersion: string) {
    super(`Unsupported PostgreSQL version: ${databaseVersion}`);
  }
}
