import 'package:flutter/foundation.dart';
import 'package:immich_data/db/database.dart';
import 'package:immich_data/db/logger.dart';
import 'package:immich_data/db/person.dart';
import 'package:immich_data/server/person.dart';
import 'package:immich_data/store/person.dart';
import 'package:openapi/api.dart';
import 'package:sqlite3/common.dart';

/// Controls all data access. Serves request against the HTTP API and the Drift DB
class DataController {
  final Drift _db;
  final DriftLogger _logDb;
  final ApiClient _apiClient;

  /// Whether the log database was corrupt and had to be recreated during [init]
  final bool loggerDatabaseWasRecreated;

  DataController._(this._db, this._logDb, this._apiClient, {required this.loggerDatabaseWasRecreated});

  static Future<DataController> init({required ApiClient apiClient}) async {
    await configureSqliteCache();

    final (db, updatePool) = await openSqliteConnectionWithUpdatePool(name: 'immich');
    final drift = Drift.sqlite(db, updatePool);

    final (logDb, wasRecreated) = await _openLoggerDatabase();

    return DataController._(drift, logDb, apiClient, loggerDatabaseWasRecreated: wasRecreated);
  }

  /// Open the logger database, recreating if corrupt. Returns the logger and whether it was recreated
  static Future<(DriftLogger, bool)> _openLoggerDatabase() async {
    Future<DriftLogger> open() async => DriftLogger.sqlite(await openSqliteConnection(name: 'immich_logs'));

    final DriftLogger logDb = await open();

    try {
      await logDb.customSelect('SELECT COUNT(*) FROM logger_messages').get();
    } on SqliteException catch (error) {
      if (error.resultCode != SqlError.SQLITE_CORRUPT && error.resultCode != SqlError.SQLITE_NOTADB) {
        await logDb.close();
        rethrow;
      }

      if (kDebugMode) {
        // ignore: banned-usage
        debugPrint('Logs database is corrupt, recreating it');
      }

      await logDb.close();
      await deleteSqliteDatabase(name: 'immich_logs');

      return (await open(), true);
    }

    return (logDb, false);
  }

  late final PersonService people = PersonService(
    PersonDatabaseRepository(_db),
    PersonApiRepository(PeopleApi(_apiClient)),
  );

  /// Direct database access for the logic that has not yet moved into this package
  // TODO(rewrite): Remove once all repositories have migrated into this package
  Drift get db => _db;

  /// Direct logging access for the logic that has not yet moved into this package
  // TODO(rewrite): Remove once all repositories have migrated into this package
  DriftLogger get logDb => _logDb;

  Future<void> close() async {
    await _db.close();

    // Close after the primary DB to ensure all logs are captured
    await _logDb.close();
  }
}
