import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:immich_mobile/domain/services/local_sync.service.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/platform/background_worker_api.g.dart';
import 'package:immich_mobile/platform/background_worker_lock_api.g.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/services/localization.service.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/wm_executor.dart';
import 'package:logging/logging.dart';

class BackgroundWorkerFgService {
  final BackgroundWorkerFgHostApi _foregroundHostApi;

  const BackgroundWorkerFgService(this._foregroundHostApi);

  // TODO: Move this call to native side once old timeline is removed
  Future<void> enable() => _foregroundHostApi.enable();

  Future<void> saveNotificationMessage(String title, String body) =>
      _foregroundHostApi.saveNotificationMessage(title, body);

  Future<void> configure({int? minimumDelaySeconds, bool? requireCharging}) {
    final backup = SettingsRepository.instance.appConfig.backup;
    return _foregroundHostApi.configure(
      BackgroundWorkerSettings(
        minimumDelaySeconds: minimumDelaySeconds ?? backup.triggerDelay,
        requiresCharging: requireCharging ?? backup.requireCharging,
      ),
    );
  }

  Future<void> disable() => _foregroundHostApi.disable();
}

class BackgroundWorkerBgService extends BackgroundWorkerFlutterApi {
  ProviderContainer? _ref;
  final Drift _drift;
  final DriftLogger _driftLogger;
  final BackgroundWorkerBgHostApi _backgroundHostApi;
  final _cancellationToken = Completer<void>();
  final Logger _logger = Logger('BackgroundWorkerBgService');
  late LocalSyncService _localSyncService;
  late SyncStreamService _remoteSyncService;
  late HashService _hashService;

  bool _isCleanedUp = false;

  BackgroundWorkerBgService({required this._drift, required this._driftLogger})
    : _backgroundHostApi = BackgroundWorkerBgHostApi() {
    final ref = ProviderContainer(overrides: [driftProvider.overrideWith(driftOverride(_drift))]);
    _ref = ref;
    _localSyncService = LocalSyncService(
      localAlbumRepository: ref.read(localAlbumRepository),
      localAssetRepository: ref.read(localAssetRepository),
      nativeSyncApi: ref.read(nativeSyncApiProvider),
      trashedLocalAssetRepository: ref.read(trashedLocalAssetRepository),
      assetMediaRepository: ref.read(assetMediaRepositoryProvider),
      permissionRepository: ref.read(permissionRepositoryProvider),
      cancellation: _cancellationToken,
    );
    _remoteSyncService = SyncStreamService(
      syncApiRepository: ref.read(syncApiRepositoryProvider),
      syncStreamRepository: ref.read(syncStreamRepositoryProvider),
      localAssetRepository: ref.read(localAssetRepository),
      trashedLocalAssetRepository: ref.read(trashedLocalAssetRepository),
      assetMediaRepository: ref.read(assetMediaRepositoryProvider),
      permissionRepository: ref.read(permissionRepositoryProvider),
      syncMigrationRepository: ref.read(syncMigrationRepositoryProvider),
      api: ref.read(apiServiceProvider),
      cancellation: _cancellationToken,
    );
    _hashService = HashService(
      localAlbumRepository: ref.read(localAlbumRepository),
      localAssetRepository: ref.read(localAssetRepository),
      nativeSyncApi: ref.read(nativeSyncApiProvider),
      trashedLocalAssetRepository: ref.read(trashedLocalAssetRepository),
      cancellation: _cancellationToken,
    );
    BackgroundWorkerFlutterApi.setUp(this);
  }

  bool get _isBackupEnabled => SettingsRepository.instance.appConfig.backup.enabled;

  Future<void> init() async {
    try {
      await Future.wait(
        [
          loadTranslations(),
          workerManagerPatch.init(dynamicSpawning: true),
          _ref?.read(authServiceProvider).setOpenApiServiceEndpoint(),
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
        ].nonNulls,
      );

      configureFileDownloaderNotifications();

      // Notify the host that the background worker service has been initialized and is ready to use
      unawaited(_backgroundHostApi.onInitialized());
    } catch (error, stack) {
      _logger.severe("Failed to initialize background worker", error, stack);
      unawaited(_backgroundHostApi.close());
    }
  }

  @override
  Future<void> onAndroidUpload(int? maxMinutes) async {
    final hashTimeout = Duration(minutes: _isBackupEnabled ? 3 : 6);
    final backupTimeout = maxMinutes != null ? Duration(minutes: maxMinutes - 1) : null;
    await _optimizeDB();
    return _backgroundLoop(
      hashTimeout: hashTimeout,
      backupTimeout: backupTimeout,
      debugLabel: 'Android background upload',
    );
  }

  @override
  Future<void> onIosUpload(bool isRefresh, int? maxSeconds) async {
    _logger.info('iOS background upload started with maxSeconds: ${maxSeconds}s');
    final sw = Stopwatch()..start();
    try {
      final budget = maxSeconds != null ? Duration(seconds: maxSeconds - 1) : null;

      // Only for Background Processing tasks
      if (maxSeconds == null) {
        await _optimizeDB();
      }

      // Run sync local, sync remote, hash and backup concurrently so the bg
      // refresh task (20s budget) can make progress on all four instead of
      // racing them sequentially. Phases are independent at the data layer:
      // hash and handle_backup read drift state and tolerate stale reads
      // (server-side dedup catches the rare race). The single budget caps the
      // whole batch; no phase needs its own timeout.
      final all = Future.wait<dynamic>([
        _localSyncService.sync(),
        _remoteSyncService.sync(),
        _hashService.hashAssets(),
        _handleBackup(),
      ]);
      if (budget != null) {
        await all.timeout(
          budget,
          onTimeout: () {
            if (!_cancellationToken.isCompleted) {
              _logger.warning("iOS background upload timed out after ${budget.inSeconds}s, cancelling tasks");
              _cancellationToken.complete();
            }
            return <dynamic>[];
          },
        );
      } else {
        await all;
      }
    } catch (error, stack) {
      _logger.severe("Failed to complete iOS background upload", error, stack);
    } finally {
      sw.stop();
      _logger.info("iOS background upload completed in ${sw.elapsed.inSeconds}s");
      await _cleanup();
    }
  }

  Future<void> _backgroundLoop({
    required Duration hashTimeout,
    required Duration? backupTimeout,
    required String debugLabel,
  }) async {
    _logger.info(
      '$debugLabel started hashTimeout: ${hashTimeout.inSeconds}s, backupTimeout: ${backupTimeout?.inMinutes ?? '~'}m',
    );
    final sw = Stopwatch()..start();
    try {
      if (!await _syncAssets(hashTimeout: hashTimeout)) {
        _logger.warning("Remote sync did not complete successfully, skipping backup");
        return;
      }

      final backupFuture = _handleBackup();
      Timer? cancelTimer;
      if (backupTimeout != null) {
        cancelTimer = Timer(backupTimeout, () {
          if (!_cancellationToken.isCompleted) {
            _logger.warning("$debugLabel timed out after ${backupTimeout.inMinutes}m, cancelling backup");
            _cancellationToken.complete();
          }
        });
      }
      try {
        await backupFuture;
      } finally {
        cancelTimer?.cancel();
      }
    } catch (error, stack) {
      _logger.severe("Failed to complete $debugLabel", error, stack);
    } finally {
      sw.stop();
      _logger.info("$debugLabel completed in ${sw.elapsed.inSeconds}s");
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

  Future<void> _optimizeDB() async {
    try {
      await (_drift.optimize(allTables: true), _driftLogger.optimize()).wait;
    } catch (error, stack) {
      dPrint(() => "Error during background worker optimize: $error, $stack");
    }
  }

  Future<void> _cleanup() async {
    await runZonedGuarded(_handleCleanup, (error, stack) {
      dPrint(() => "Error during background worker cleanup: $error, $stack");
    });
  }

  Future<void> _handleCleanup() async {
    // If ref is null, it means the service was never initialized properly
    if (_isCleanedUp || _ref == null) {
      return;
    }

    try {
      _isCleanedUp = true;
      final nativeSyncApi = _ref?.read(nativeSyncApiProvider);

      _logger.info("Cleaning up background worker");
      if (!_cancellationToken.isCompleted) {
        _cancellationToken.complete();
      }

      // Workers share one sqlite connection, so DB teardown must wait until every worker has stopped using it.
      await Future.wait([if (nativeSyncApi != null) nativeSyncApi.cancelHashing()]);
      await workerManagerPatch.dispose().catchError((_) async {});
      await Future.wait([LogService.I.dispose(), Store.dispose()]);
      await _drift.close();
      await _driftLogger.close();

      _ref?.dispose();
      _ref = null;
    } catch (error, stack) {
      dPrint(() => 'Failed to cleanup background worker: $error with stack: $stack');
    }
  }

  Future<void> _handleBackup() async {
    await runZonedGuarded(
      () async {
        if (_isCleanedUp) {
          return;
        }

        if (!_isBackupEnabled) {
          _logger.info("Backup is disabled. Skipping backup routine");
          return;
        }

        final currentUser = _ref?.read(currentUserProvider);
        if (currentUser == null) {
          _logger.warning("No current user found. Skipping backup from background");
          return;
        }

        if (Platform.isIOS) {
          return _ref?.read(driftBackupProvider.notifier).startBackupWithURLSession(currentUser.id);
        }

        return _ref
            ?.read(foregroundUploadServiceProvider)
            .uploadCandidates(currentUser.id, _cancellationToken, useSequentialUpload: true);
      },
      (error, stack) {
        dPrint(() => "Error in backup zone $error, $stack");
      },
    );
  }

  Future<bool> _syncAssets({Duration? hashTimeout}) async {
    await _localSyncService.sync();
    if (_isCleanedUp) {
      return false;
    }

    final isSuccess = await _remoteSyncService.sync();
    if (_isCleanedUp) {
      return isSuccess;
    }

    var hashFuture = _hashService.hashAssets();
    if (hashTimeout != null) {
      hashFuture = hashFuture.timeout(
        hashTimeout,
        onTimeout: () {
          // Consume cancellation errors as we want to continue processing
        },
      );
    }

    await hashFuture;
    return isSuccess;
  }
}

class BackgroundWorkerLockService {
  final BackgroundWorkerLockApi _hostApi;
  const BackgroundWorkerLockService(this._hostApi);

  Future<void> lock() async {
    if (CurrentPlatform.isAndroid) {
      return _hostApi.lock();
    }
  }

  Future<void> unlock() async {
    if (CurrentPlatform.isAndroid) {
      return _hostApi.unlock();
    }
  }
}

/// Native entry invoked from the background worker. If renaming or moving this to a different
/// library, make sure to update the entry points and URI in native workers as well
@pragma('vm:entry-point')
Future<void> backgroundSyncNativeEntrypoint() async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();

  final (drift, logDB) = await Bootstrap.initDomain(shouldBufferLogs: false, listenStoreUpdates: false);
  await BackgroundWorkerBgService(drift: drift, driftLogger: logDB).init();
}
