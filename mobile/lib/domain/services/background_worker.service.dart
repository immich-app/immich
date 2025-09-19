import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:background_downloader/background_downloader.dart';
import 'package:cancellation_token_http/http.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/network_capability_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/generated/intl_keys.g.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/localization.service.dart';
import 'package:immich_mobile/services/server_info.service.dart';
import 'package:immich_mobile/services/upload.service.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/utils/http_ssl_options.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:worker_manager/worker_manager.dart';

class BackgroundWorkerFgService {
  final BackgroundWorkerFgHostApi _foregroundHostApi;

  const BackgroundWorkerFgService(this._foregroundHostApi);

  // TODO: Move this call to native side once old timeline is removed
  Future<void> enable() => _foregroundHostApi.enable();

  Future<void> configure({int? minimumDelaySeconds, bool? requireCharging}) => _foregroundHostApi.configure(
    BackgroundWorkerSettings(
      minimumDelaySeconds:
          minimumDelaySeconds ??
          Store.get(AppSettingsEnum.backupTriggerDelay.storeKey, AppSettingsEnum.backupTriggerDelay.defaultValue),
      requiresCharging:
          requireCharging ??
          Store.get(AppSettingsEnum.backupRequireCharging.storeKey, AppSettingsEnum.backupRequireCharging.defaultValue),
    ),
  );

  Future<void> disable() => _foregroundHostApi.disable();
}

class BackgroundWorkerBgService extends BackgroundWorkerFlutterApi {
  late final ProviderContainer _ref;
  final Isar _isar;
  final Drift _drift;
  final DriftLogger _driftLogger;
  final BackgroundWorkerBgHostApi _backgroundHostApi;
  final CancellationToken _cancellationToken = CancellationToken();
  final Logger _logger = Logger('BackgroundWorkerBgService');

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
    try {
      HttpSSLOptions.apply(applyNative: false);

      await Future.wait([
        loadTranslations(),
        workerManager.init(dynamicSpawning: true),
        _ref.read(authServiceProvider).setOpenApiServiceEndpoint(),
        // Initialize the file downloader
        FileDownloader().configure(
          globalConfig: [
            // maxConcurrent: 6, maxConcurrentByHost(server):6, maxConcurrentByGroup: 3
            (Config.holdingQueue, (6, 6, 3)),
            // On Android, if files are larger than 256MB, run in foreground service
            (Config.runInForegroundIfFileLargerThan, 256),
          ],
        ),
        FileDownloader().trackTasksInGroup(kDownloadGroupLivePhoto, markDownloadedComplete: false),
        FileDownloader().trackTasks(),
        _ref.read(fileMediaRepositoryProvider).enableBackgroundAccess(),
      ]);

      configureFileDownloaderNotifications();

      if (Platform.isAndroid) {
        await _backgroundHostApi.showNotification(
          IntlKeys.uploading_media.t(),
          IntlKeys.backup_background_service_in_progress_notification.t(),
        );
      }

      // Notify the host that the background worker service has been initialized and is ready to use
      _backgroundHostApi.onInitialized();
    } catch (error, stack) {
      _logger.severe("Failed to initialize background worker", error, stack);
      _backgroundHostApi.close();
    }
  }

  @override
  Future<void> onAndroidUpload() async {
    try {
      _logger.info('Android background processing started');
      final sw = Stopwatch()..start();

      await _syncAssets(hashTimeout: Duration(minutes: _isBackupEnabled ? 3 : 6));
      await _handleBackup();

      sw.stop();
      _logger.info("Android background processing completed in ${sw.elapsed.inSeconds}s");
    } catch (error, stack) {
      _logger.severe("Failed to complete Android background processing", error, stack);
    } finally {
      await _cleanup();
    }
  }

  @override
  Future<void> onIosUpload(bool isRefresh, int? maxSeconds) async {
    try {
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

      sw.stop();
      _logger.info("iOS background upload completed in ${sw.elapsed.inSeconds}s");
    } catch (error, stack) {
      _logger.severe("Failed to complete iOS background upload", error, stack);
    } finally {
      await _cleanup();
    }
  }

  @override
  Future<void> cancel() async {
    _logger.warning("Background worker cancelled");
    try {
      await _cleanup();
    } catch (error, stack) {
      dPrint(() => 'Failed to cleanup background worker: $error with stack: $stack');
    }
  }

  Future<void> _cleanup() async {
    if (_isCleanedUp) {
      return;
    }

    try {
      final backgroundSyncManager = _ref.read(backgroundSyncProvider);
      final nativeSyncApi = _ref.read(nativeSyncApiProvider);
      _isCleanedUp = true;
      _ref.dispose();

      _cancellationToken.cancel();
      _logger.info("Cleaning up background worker");
      final cleanupFutures = [
        workerManager.dispose().catchError((_) async {
          // Discard any errors on the dispose call
          return;
        }),
        LogService.I.dispose(),
        Store.dispose(),
        _drift.close(),
        _driftLogger.close(),
        backgroundSyncManager.cancel(),
        nativeSyncApi.cancelHashing(),
      ];

      if (_isar.isOpen) {
        cleanupFutures.add(_isar.close());
      }
      await Future.wait(cleanupFutures);
      _logger.info("Background worker resources cleaned up");
    } catch (error, stack) {
      dPrint(() => 'Failed to cleanup background worker: $error with stack: $stack');
    }
  }

  Future<void> _handleBackup() async {
    await runZonedGuarded(
      () async {
        if (!_isBackupEnabled || _isCleanedUp) {
          _logger.info("[_handleBackup 1] Backup is disabled. Skipping backup routine");
          return;
        }

        _logger.info("[_handleBackup 2] Enqueuing assets for backup from the background service");

        final currentUser = _ref.read(currentUserProvider);
        if (currentUser == null) {
          _logger.warning("[_handleBackup 3] No current user found. Skipping backup from background");
          return;
        }

        _logger.info("[_handleBackup 4] Resume backup from background");
        if (Platform.isIOS) {
          return _ref.read(driftBackupProvider.notifier).handleBackupResume(currentUser.id);
        }

        final canPing = await _ref.read(serverInfoServiceProvider).ping();
        if (!canPing) {
          _logger.warning("[_handleBackup 5] Server is not reachable. Skipping backup from background");
          return;
        }

        final networkCapabilities = await _ref.read(connectivityApiProvider).getCapabilities();

        return _ref
            .read(uploadServiceProvider)
            .startBackupWithHttpClient(currentUser.id, networkCapabilities.hasWifi, _cancellationToken);
      },
      (error, stack) {
        dPrint(() => "Error in backup zone $error, $stack");
      },
    );
  }

  Future<void> _syncAssets({Duration? hashTimeout}) async {
    await _ref.read(backgroundSyncProvider).syncLocal();
    if (_isCleanedUp) {
      return;
    }

    await _ref.read(backgroundSyncProvider).syncRemote();
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

    await hashFuture;
  }
}

/// Native entry invoked from the background worker. If renaming or moving this to a different
/// library, make sure to update the entry points and URI in native workers as well
@pragma('vm:entry-point')
Future<void> backgroundSyncNativeEntrypoint() async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();

  final (isar, drift, logDB) = await Bootstrap.initDB();
  await Bootstrap.initDomain(isar, drift, logDB, shouldBufferLogs: false, listenStoreUpdates: false);
  await BackgroundWorkerBgService(isar: isar, drift: drift, driftLogger: logDB).init();
}
