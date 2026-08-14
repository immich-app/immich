import 'package:background_downloader/background_downloader.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:sqlite3/common.dart';

void configureFileDownloaderNotifications() {
  final t = StaticTranslations.instance;

  FileDownloader().configureNotificationForGroup(
    kDownloadGroupImage,
    running: TaskNotification(t.downloading_media, '${t.file_name_text}: {filename}'),
    complete: TaskNotification(t.download_finished, '${t.file_name_text}: {filename}'),
    progressBar: true,
  );

  FileDownloader().configureNotificationForGroup(
    kDownloadGroupVideo,
    running: TaskNotification(t.downloading_media, '${t.file_name_text}: {filename}'),
    complete: TaskNotification(t.download_finished, '${t.file_name_text}: {filename}'),
    progressBar: true,
  );

  FileDownloader().configureNotificationForGroup(
    kManualUploadGroup,
    running: TaskNotification(t.uploading_media, t.backup_background_service_in_progress_notification),
    complete: TaskNotification(t.upload_finished, t.backup_background_service_complete_notification),
    groupNotificationId: kManualUploadGroup,
  );

  FileDownloader().configureNotificationForGroup(
    kBackupGroup,
    running: TaskNotification(t.uploading_media, t.backup_background_service_in_progress_notification),
    complete: TaskNotification(t.upload_finished, t.backup_background_service_complete_notification),
    groupNotificationId: kBackupGroup,
  );
}

abstract final class Bootstrap {
  static Future<(Drift, DriftLogger)> initDomain({bool listenStoreUpdates = true, bool shouldBufferLogs = true}) async {
    await configureSqliteCache();
    final (db, updatePool) = await openSqliteConnectionWithUpdatePool(name: 'immich');
    final drift = Drift.sqlite(db, updatePool);
    final DriftStoreRepository storeRepo = DriftStoreRepository(drift);

    await StoreService.init(storeRepository: storeRepo, listenUpdates: listenStoreUpdates);

    final settingsRepo = await SettingsRepository.ensureInitialized(drift);
    final logDb = await _initLogger(settingsRepository: settingsRepo, shouldBufferLogs: shouldBufferLogs);

    await NetworkRepository.init();
    // Remove once all asset operations are migrated to Native APIs
    await PhotoManager.setIgnorePermissionCheck(true);
    return (drift, logDb);
  }
}

Future<DriftLogger> _initLogger({required SettingsRepository settingsRepository, bool shouldBufferLogs = true}) async {
  Future<DriftLogger> open() async => DriftLogger.sqlite(await openSqliteConnection(name: 'immich_logs'));

  DriftLogger logDb = await open();
  bool wasCorrupt = false;
  try {
    await logDb.customSelect('SELECT COUNT(*) FROM logger_messages').get();
  } on SqliteException catch (error) {
    if (error.resultCode != SqlError.SQLITE_CORRUPT && error.resultCode != SqlError.SQLITE_NOTADB) {
      await logDb.close();
      rethrow;
    }
    dPrint(() => 'Logs database is corrupt, recreating it');
    await logDb.close();
    await deleteSqliteDatabase(name: 'immich_logs');
    logDb = await open();
    wasCorrupt = true;
  }

  await LogService.init(
    logRepository: LogRepository(logDb),
    settingsRepository: settingsRepository,
    shouldBuffer: shouldBufferLogs,
  );
  if (wasCorrupt) {
    Logger('bootstrap:initLogger').warning('Logs database was corrupt and has been recreated');
  }
  return logDb;
}
