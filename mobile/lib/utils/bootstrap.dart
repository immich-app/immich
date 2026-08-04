import 'package:background_downloader/background_downloader.dart';
import 'package:immich_data/data_controller.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

void configureFileDownloaderNotifications() {
  FileDownloader().configureNotificationForGroup(
    kDownloadGroupImage,
    running: TaskNotification('downloading_media'.t(), '${'file_name_text'.t()}: {filename}'),
    complete: TaskNotification('download_finished'.t(), '${'file_name_text'.t()}: {filename}'),
    progressBar: true,
  );

  FileDownloader().configureNotificationForGroup(
    kDownloadGroupVideo,
    running: TaskNotification('downloading_media'.t(), '${'file_name_text'.t()}: {filename}'),
    complete: TaskNotification('download_finished'.t(), '${'file_name_text'.t()}: {filename}'),
    progressBar: true,
  );

  FileDownloader().configureNotificationForGroup(
    kManualUploadGroup,
    running: TaskNotification('uploading_media'.t(), 'backup_background_service_in_progress_notification'.t()),
    complete: TaskNotification('upload_finished'.t(), 'backup_background_service_complete_notification'.t()),
    groupNotificationId: kManualUploadGroup,
  );

  FileDownloader().configureNotificationForGroup(
    kBackupGroup,
    running: TaskNotification('uploading_media'.t(), 'backup_background_service_in_progress_notification'.t()),
    complete: TaskNotification('upload_finished'.t(), 'backup_background_service_complete_notification'.t()),
    groupNotificationId: kBackupGroup,
  );
}

abstract final class Bootstrap {
  static Future<(DataController, ApiService)> initDomain({
    bool listenStoreUpdates = true,
    bool shouldBufferLogs = true,
  }) async {
    await NetworkRepository.init();

    final apiService = ApiService("");

    final data = await DataController.init(apiClient: apiService.apiClient);

    await StoreService.init(storeRepository: DriftStoreRepository(data.db), listenUpdates: listenStoreUpdates);

    // TODO(rewrite): This is really bad
    final endpoint = Store.tryGet(StoreKey.serverEndpoint);

    if (endpoint != null) {
      apiService.setEndpoint(endpoint);
    }

    final settingsRepo = await SettingsRepository.ensureInitialized(data.db);

    // Take [DataController]'s logging DB and register it with the logging service
    await LogService.init(
      logRepository: LogRepository(data.logDb),
      settingsRepository: settingsRepo,
      shouldBuffer: shouldBufferLogs,
    );

    if (data.loggerDatabaseWasRecreated) {
      Logger('bootstrap:initLogger').warning('Logs database was corrupt and has been recreated');
    }

    // Remove once all asset operations are migrated to Native APIs
    await PhotoManager.setIgnorePermissionCheck(true);
    return (data, apiService);
  }
}
