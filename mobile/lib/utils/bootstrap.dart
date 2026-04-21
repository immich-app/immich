import 'package:background_downloader/background_downloader.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
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
  static Future<(Drift, DriftLogger)> initDomain({bool listenStoreUpdates = true, bool shouldBufferLogs = true}) async {
    final drift = Drift();
    final logDb = DriftLogger();
    final DriftStoreRepository storeRepo = DriftStoreRepository(drift);

    await StoreService.init(storeRepository: storeRepo, listenUpdates: listenStoreUpdates);

    await LogService.init(
      logRepository: LogRepository(logDb),
      storeRepository: storeRepo,
      shouldBuffer: shouldBufferLogs,
    );

    await NetworkRepository.init();
    // Remove once all asset operations are migrated to Native APIs
    await PhotoManager.setIgnorePermissionCheck(true);
    return (drift, logDb);
  }
}
