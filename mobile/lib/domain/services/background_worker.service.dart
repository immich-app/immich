import 'dart:async';
import 'dart:ui';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
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

class BackgroundWorkerFgService {
  final BackgroundWorkerFgHostApi _foregroundHostApi;

  const BackgroundWorkerFgService(this._foregroundHostApi);

  // TODO: Move this call to native side once old timeline is removed
  Future<void> enableSyncService() => _foregroundHostApi.enableSyncWorker();

  Future<void> enableUploadService() => _foregroundHostApi.enableUploadWorker(
    PluginUtilities.getCallbackHandle(_backgroundSyncNativeEntrypoint)!.toRawHandle(),
  );

  Future<void> disableUploadService() => _foregroundHostApi.disableUploadWorker();
}

class BackgroundWorkerBgService extends BackgroundWorkerFlutterApi {
  late final ProviderContainer _ref;
  final Isar _isar;
  final Drift _drift;
  final DriftLogger _driftLogger;
  final BackgroundWorkerBgHostApi _backgroundHostApi;
  final Logger _logger = Logger('BackgroundUploadBgService');

  bool _isCleanedUp = false;

  BackgroundWorkerBgService({required Isar isar, required Drift drift, required DriftLogger driftLogger})
    : _isar = isar,
      _drift = drift,
      _driftLogger = driftLogger,
      _backgroundHostApi = BackgroundWorkerBgHostApi() {
    _ref = ProviderContainer(
      overrides: [
        dbProvider.overrideWithValue(isar),
        isarProvider.overrideWithValue(isar),
        driftProvider.overrideWith(driftOverride(drift)),
      ],
    );
    BackgroundWorkerFlutterApi.setUp(this);
  }

  bool get _isBackupEnabled => _ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);

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

  @override
  Future<void> onLocalSync(int? maxSeconds) async {
    _logger.info('Local background syncing started');
    final sw = Stopwatch()..start();

    final timeout = maxSeconds != null ? Duration(seconds: maxSeconds) : null;
    await _syncAssets(hashTimeout: timeout, syncRemote: false);

    sw.stop();
    _logger.info("Local sync completed in ${sw.elapsed.inSeconds}s");
  }

  /* We do the following on Android upload
   * - Sync local assets
   * - Hash local assets 3 / 6 minutes
   * - Sync remote assets
   * - Check and requeue upload tasks
   */
  @override
  Future<void> onAndroidUpload() async {
    _logger.info('Android background processing started');
    final sw = Stopwatch()..start();

    await _syncAssets(hashTimeout: Duration(minutes: _isBackupEnabled ? 3 : 6));
    await _handleBackup(processBulk: false);

    await _cleanup();

    sw.stop();
    _logger.info("Android background processing completed in ${sw.elapsed.inSeconds}s");
  }

  /* We do the following on background upload
   * - Sync local assets
   * - Hash local assets
   * - Sync remote assets
   * - Check and requeue upload tasks
   * 
   *  The native side will not send the maxSeconds value for processing tasks
   */
  @override
  Future<void> onIosUpload(bool isRefresh, int? maxSeconds) async {
    _logger.info('iOS background upload started with maxSeconds: ${maxSeconds}s');
    final sw = Stopwatch()..start();

    final timeout = isRefresh ? const Duration(seconds: 5) : Duration(minutes: _isBackupEnabled ? 3 : 6);
    await _syncAssets(hashTimeout: timeout);

    final backupFuture = _handleBackup();
    if (maxSeconds != null) {
      await backupFuture.timeout(Duration(seconds: maxSeconds - 1), onTimeout: () {});
    } else {
      await backupFuture;
    }

    await _cleanup();

    sw.stop();
    _logger.info("iOS background upload completed in ${sw.elapsed.inSeconds}s");
  }

  @override
  Future<void> cancel() async {
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

  Future<void> _handleBackup({bool processBulk = true}) async {
    if (!_isBackupEnabled) {
      return;
    }

    final currentUser = _ref.read(currentUserProvider);
    if (currentUser == null) {
      return;
    }

    if (processBulk) {
      return _ref.read(driftBackupProvider.notifier).handleBackupResume(currentUser.id);
    }

    final activeTask = await _ref.read(uploadServiceProvider).getActiveTasks(currentUser.id);
    if (activeTask.isNotEmpty) {
      await _ref.read(uploadServiceProvider).resumeBackup();
    } else {
      await _ref.read(uploadServiceProvider).startBackupSerial(currentUser.id);
    }
  }

  Future<void> _syncAssets({Duration? hashTimeout, bool syncRemote = true}) async {
    final futures = <Future<void>>[];

    final localSyncFuture = _ref.read(backgroundSyncProvider).syncLocal().then((_) async {
      if (_isCleanedUp) {
        return;
      }

      var hashFuture = _ref.read(backgroundSyncProvider).hashAssets();
      if (hashTimeout != null) {
        hashFuture = hashFuture.timeout(
          hashTimeout,
          onTimeout: () {
            // Consume cancellation errors as we want to continue processing
          },
        );
      }

      return hashFuture;
    });

    futures.add(localSyncFuture);
    if (syncRemote) {
      final remoteSyncFuture = _ref.read(backgroundSyncProvider).syncRemote();
      futures.add(remoteSyncFuture);
    }

    await Future.wait(futures);
  }
}

@pragma('vm:entry-point')
Future<void> _backgroundSyncNativeEntrypoint() async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();

  final (isar, drift, logDB) = await Bootstrap.initDB();
  await Bootstrap.initDomain(isar, drift, logDB, shouldBufferLogs: false);
  await BackgroundWorkerBgService(isar: isar, drift: drift, driftLogger: logDB).init();
}
