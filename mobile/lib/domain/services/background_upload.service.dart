import 'dart:async';
import 'dart:ui';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/platform/background_upload_api.g.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/localization.service.dart';
import 'package:immich_mobile/services/upload.service.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/utils/http_ssl_options.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';

class BackgroundUploadFgService {
  final BackgroundUploadFgHostApi _foregroundHostApi;

  const BackgroundUploadFgService(this._foregroundHostApi);

  Future<void> enable() =>
      _foregroundHostApi.enable(PluginUtilities.getCallbackHandle(_backgroundSyncNativeEntrypoint)!.toRawHandle());

  Future<void> disable() => _foregroundHostApi.disable();
}

class BackgroundUploadBgService extends BackgroundUploadFlutterApi {
  late final ProviderContainer _ref;
  final Isar _isar;
  final Drift _drift;
  final DriftLogger _driftLogger;
  final BackgroundUploadBgHostApi _backgroundHostApi;
  final Logger _logger = Logger('BackgroundUploadBgService');

  bool _isCancelled = false;
  bool _isCleanedUp = false;

  BackgroundUploadBgService({required Isar isar, required Drift drift, required DriftLogger driftLogger})
    : _isar = isar,
      _drift = drift,
      _driftLogger = driftLogger,
      _backgroundHostApi = BackgroundUploadBgHostApi() {
    _ref = ProviderContainer(
      overrides: [
        dbProvider.overrideWithValue(isar),
        isarProvider.overrideWithValue(isar),
        driftProvider.overrideWith(driftOverride(drift)),
        cancellationProvider.overrideWithValue(cancelledChecker),
      ],
    );
    BackgroundUploadFlutterApi.setUp(this);
  }

  Future<void> init() async {
    await loadTranslations();
    HttpSSLOptions.apply(applyNative: false);
    await _ref.read(authServiceProvider).setOpenApiServiceEndpoint();

    // Initialize the file downloader
    await FileDownloader().configure(
      globalConfig: [
        // maxConcurrent: 6, maxConcurrentByHost(server):6, maxConcurrentByGroup: 3
        (Config.holdingQueue, (6, 6, 3)),
        // On Android, if files are larger than 256MB, run in foreground service
        (Config.runInForegroundIfFileLargerThan, 256),
      ],
    );
    await FileDownloader().trackTasksInGroup(kDownloadGroupLivePhoto, markDownloadedComplete: false);
    await FileDownloader().trackTasks();
    configureFileDownloaderNotifications();

    // Notify the host that the background upload service has been initialized and is ready to use
    await _backgroundHostApi.onInitialized();
  }

  bool cancelledChecker() => _isCancelled;

  @override
  Future<void> onAndroidBackgroundUpload() async {
    _logger.info('Android background processing started');
    final sw = Stopwatch()..start();

    final isEnableBackup = _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);
    final remoteSyncFuture = _ref.read(backgroundSyncProvider).syncRemote();
    await _ref.read(backgroundSyncProvider).syncLocal().then((_) async {
      return _ref
          .read(backgroundSyncProvider)
          .hashAssets()
          // Try to hash assets for 3 minutes, then break and continue with queueing assets for backup
          // If backup is not enabled, hash assets for double the time
          .timeout(
            Duration(minutes: isEnableBackup ? 3 : 6),
            onTimeout: () {
              // Consume cancellation errors as we want to continue processing
            },
          );
    });

    try {
      await remoteSyncFuture;
    } catch (error, stack) {
      Logger('BackgroundUploadBgService').warning('Error occurred during Android background processing', error, stack);
      return;
    }

    if (isEnableBackup) {
      final currentUser = _ref.read(currentUserProvider);
      if (currentUser == null) {
        return;
      }

      final activeTask = await _ref.read(uploadServiceProvider).getActiveTasks(currentUser.id);
      if (activeTask.isNotEmpty) {
        await _ref.read(uploadServiceProvider).resumeBackup();
      } else {
        await _ref.read(uploadServiceProvider).startBackupBackground(currentUser.id);
      }
    }

    await _cleanup();

    sw.stop();
    _logger.info("Android background processing completed in ${sw.elapsed.inSeconds}s");
  }

  /* We do the following on background processing
   * - Sync local assets
   * - Sync remote assets
   * - Hash local assets
   * - Check and requeue upload tasks
   */
  @override
  Future<void> onIosBackgroundProcessing() async {
    _logger.info('iOS background processing started');
    final sw = Stopwatch()..start();

    final isEnableBackup = _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);
    final remoteSyncFuture = _ref.read(backgroundSyncProvider).syncRemote();
    await _ref.read(backgroundSyncProvider).syncLocal().then((_) async {
      return _ref
          .read(backgroundSyncProvider)
          .hashAssets()
          // Try to hash assets for 3 minutes, then break and continue with queueing assets for backup
          // If backup is not enabled, hash assets for double the time
          .timeout(
            Duration(minutes: isEnableBackup ? 3 : 6),
            onTimeout: () {
              // Consume cancellation errors as we want to continue processing
            },
          );
    });

    try {
      await remoteSyncFuture;
    } catch (error, stack) {
      Logger('BackgroundUploadBgService').warning('Error occurred during iOS background processing', error, stack);
      return;
    }

    if (isEnableBackup) {
      final currentUser = _ref.read(currentUserProvider);
      if (currentUser == null) {
        return;
      }

      await _ref.read(driftBackupProvider.notifier).handleBackupResume(currentUser.id);
    }

    await _cleanup();

    sw.stop();
    _logger.info("iOS background processing completed in ${sw.elapsed.inSeconds}s");
  }

  /* We do the following on background refresh
   * - Sync local assets
   * - Sync remote assets
   * - Check and requeue upload tasks
   */
  @override
  Future<void> onIosBackgroundRefresh(int? maxSeconds) async {
    _logger.info('iOS background refresh started with maxSeconds: ${maxSeconds}s');
    final sw = Stopwatch()..start();

    await _ref.read(backgroundSyncProvider).syncLocal();
    await _ref.read(backgroundSyncProvider).syncRemote();

    final isEnableBackup = _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);
    if (isEnableBackup) {
      final currentUser = _ref.read(currentUserProvider);
      if (currentUser == null) {
        return;
      }

      final backupFuture = _ref.read(driftBackupProvider.notifier).handleBackupResume(currentUser.id);
      if (maxSeconds != null) {
        await backupFuture.timeout(
          Duration(seconds: maxSeconds - 1),
          onTimeout: () {
            _isCancelled = true;
          },
        );
      } else {
        await backupFuture;
      }
    }

    await _cleanup();

    sw.stop();
    _logger.info("iOS background refresh completed in ${sw.elapsed.inSeconds}s");
  }

  @override
  Future<void> cancel() async {
    _isCancelled = true;
    _logger.warning("Background upload cancelled");
    await _cleanup();
  }

  Future<void> _cleanup() async {
    if (_isCleanedUp) {
      return;
    }

    _isCleanedUp = true;
    await _ref.read(backgroundSyncProvider).cancel();
    await _ref.read(backgroundSyncProvider).cancelLocal();
    await _isar.close();
    await _drift.close();
    await _driftLogger.close();
    _ref.dispose();
  }
}

@pragma('vm:entry-point')
Future<void> _backgroundSyncNativeEntrypoint() async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();

  final (isar, drift, logDB) = await Bootstrap.initDB();
  await Bootstrap.initDomain(isar, drift, logDB, shouldBufferLogs: false);
  await BackgroundUploadBgService(isar: isar, drift: drift, driftLogger: logDB).init();
}
