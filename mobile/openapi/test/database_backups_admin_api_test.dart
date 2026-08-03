//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

import 'package:openapi/api.dart';
import 'package:test/test.dart';


/// tests for DatabaseBackupsAdminApi
void main() {
  // final instance = DatabaseBackupsAdminApi();

  group('tests for DatabaseBackupsAdminApi', () {
    // Delete database backup
    //
    // Delete a backup by its filename
    //
    //Future deleteDatabaseBackup(DatabaseBackupDeleteDto databaseBackupDeleteDto) async
    test('test deleteDatabaseBackup', () async {
      // TODO
    });

    // Download database backup
    //
    // Downloads the database backup file
    //
    //Future<MultipartFile> downloadDatabaseBackup(String filename) async
    test('test downloadDatabaseBackup', () async {
      // TODO
    });

    // List database backups
    //
    // Get the list of the successful and failed backups
    //
    //Future<DatabaseBackupListResponseDto> listDatabaseBackups() async
    test('test listDatabaseBackups', () async {
      // TODO
    });

    // Start database backup restore flow
    //
    // Put Immich into maintenance mode to restore a backup (Immich must not be configured)
    //
    //Future startDatabaseRestoreFlow() async
    test('test startDatabaseRestoreFlow', () async {
      // TODO
    });

    // Upload database backup
    //
    // Uploads .sql/.sql.gz file to restore backup from
    //
    //Future uploadDatabaseBackup({ MultipartFile file }) async
    test('test uploadDatabaseBackup', () async {
      // TODO
    });

  });
}
