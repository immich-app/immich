import 'package:background_downloader/background_downloader.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/data/data_controller.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

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
  /// Initalize the base data system. Sets up primary/logging DBs, the [ApiService], and the settings store
  ///
  /// `disableStoreWatching` prevents continually updating the setting store's cache on change
  static Future<(DataController, ApiService)> initDomain({
    bool shouldBufferLogs = true,
    bool disableStoreWatching = false,
  }) async {
    await NetworkRepository.init();

    final apiService = ApiService();
    final (dataController, loggerDatabaseWasRecreated) = await DataController.init(
      apiClient: apiService.apiClient,
      disableStoreWatching: disableStoreWatching,
    );

    final settingsRepo = await SettingsRepository.ensureInitialized(dataController.db);

    // Take DataController's logging DB and register it with the logging service
    await LogService.init(
      logRepository: LogRepository(dataController.logDb),
      settingsRepository: settingsRepo,
      shouldBuffer: shouldBufferLogs,
    );

    if (loggerDatabaseWasRecreated) {
      Logger('bootstrap:initLogger').warning('Logs database was corrupt and has been recreated');
    }

    // TODO: Remove once all asset operations are migrated to Native APIs
    await PhotoManager.setIgnorePermissionCheck(true);
    return (dataController, apiService);
  }
}
