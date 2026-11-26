export function isValidDatabaseBackupName(filename: string) {
  return /^[\d\w-.]+\.sql(?:\.gz)?$/.exec(filename);
}

export function isValidDatabaseRoutineBackupName(filename: string) {
  const oldBackupStyle = /^immich-db-backup-\d+\.sql\.gz$/.exec(filename);
  //immich-db-backup-20250729T114018-v1.136.0-pg14.17.sql.gz
  const newBackupStyle = /^immich-db-backup-\d{8}T\d{6}-v.*-pg.*\.sql\.gz$/.exec(filename);
  return oldBackupStyle || newBackupStyle;
}

export function isFailedDatabaseBackupName(filename: string) {
  return /^immich-db-backup-.*\.sql\.gz\.tmp$/.exec(filename);
}

export function findDatabaseBackupVersion(filename: string) {
  return /-v(.*)-/.exec(filename)?.[1];
}

export class UnsupportedPostgresError extends Error {
  constructor(databaseVersion: string) {
    super(`Unsupported PostgreSQL version: ${databaseVersion}`);
  }
}
