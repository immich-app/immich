import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/infrastructure/entities/device_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';

void configureFileDownloaderNotifications() {
  FileDownloader().configureNotificationForGroup(
    kDownloadGroupImage,
    running: TaskNotification('downloading_media'.t(), '${'file_name'.t()}: {filename}'),
    complete: TaskNotification('download_finished'.t(), '${'file_name'.t()}: {filename}'),
    progressBar: true,
  );

  FileDownloader().configureNotificationForGroup(
    kDownloadGroupVideo,
    running: TaskNotification('downloading_media'.t(), '${'file_name'.t()}: {filename}'),
    complete: TaskNotification('download_finished'.t(), '${'file_name'.t()}: {filename}'),
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
  static Future<(Isar isar, Drift drift, DriftLogger logDb)> initDB() async {
    final drift = Drift();
    final logDb = DriftLogger();

    Isar? isar = Isar.getInstance();

    if (isar != null) {
      return (isar, drift, logDb);
    }

    final dir = await getApplicationDocumentsDirectory();
    isar = await Isar.open(
      [
        StoreValueSchema,
        AssetSchema,
        AlbumSchema,
        ExifInfoSchema,
        UserSchema,
        BackupAlbumSchema,
        DuplicatedAssetSchema,
        ETagSchema,
        if (Platform.isAndroid) AndroidDeviceAssetSchema,
        if (Platform.isIOS) IOSDeviceAssetSchema,
        DeviceAssetEntitySchema,
      ],
      directory: dir.path,
      maxSizeMiB: 2048,
      inspector: kDebugMode,
    );

    return (isar, drift, logDb);
  }

  static Future<void> initDomain(
    Isar db,
    Drift drift,
    DriftLogger logDb, {
    bool listenStoreUpdates = true,
    bool shouldBufferLogs = true,
  }) async {
    final isBeta = await IsarStoreRepository(db).tryGet(StoreKey.betaTimeline) ?? true;
    final IStoreRepository storeRepo = isBeta ? DriftStoreRepository(drift) : IsarStoreRepository(db);

    await StoreService.init(storeRepository: storeRepo, listenUpdates: listenStoreUpdates);

    await LogService.init(
      logRepository: LogRepository(logDb),
      storeRepository: storeRepo,
      shouldBuffer: shouldBufferLogs,
    );
  }
}
