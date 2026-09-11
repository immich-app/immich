import 'package:flutter/foundation.dart';
import 'package:immich_mobile/data/db/logger/database.dart';
import 'package:immich_mobile/data/db/main/dao/person.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/server/activity.dart';
import 'package:immich_mobile/data/server/person.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:openapi/api.dart';
import 'package:sqlite3/common.dart';

/// Controls all data access. Serves request against the HTTP API and the Drift DB
class DataController {
  final Drift _db;
  final DriftLogger _logDb;
  final ApiClient _apiClient;

  DataController._(this._db, this._logDb, this._apiClient);

  /// Initalize the base data system. Sets up primary/logging DBs and the settings store
  ///
  /// `disableStoreWatching` prevents continually updating the setting store's cache on change
  static Future<(DataController, bool)> init({required ApiClient apiClient, bool disableStoreWatching = false}) async {
    await configureSqliteCache();

    final (db, updatePool) = await openSqliteConnectionWithUpdatePool(name: 'immich');
    final drift = Drift.sqlite(db, updatePool);

    final (logDb, wasRecreated) = await _openLoggerDatabase();

    await StoreService.init(storeRepository: StoreRepository(drift), listenUpdates: !disableStoreWatching);

    return (DataController._(drift, logDb, apiClient), wasRecreated);
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

  late final PeopleDatabaseRepository peopleDb = PeopleDatabaseRepository(_db);
  late final PersonApiRepository personApi = PersonApiRepository(PeopleApi(_apiClient));

  late final ActivityApiRepository activityApi = ActivityApiRepository(ActivitiesApi(_apiClient));

  /// Direct database access for the logic that has not yet been migrated
  // TODO(rewrite): Remove once all repositories have been migrated
  Drift get db => _db;

  /// Direct logging access for the logic that has not yet been migrated
  // TODO(rewrite): Remove once all repositories have been migrated
  DriftLogger get logDb => _logDb;

  Future<void> close() async {
    await _db.close();

    // Close after the primary DB to ensure all logs are captured
    await _logDb.close();
  }
}
