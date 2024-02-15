import 'dart:io';

import 'package:cancellation_token_http/http.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup_settings.provider.dart';
import 'package:immich_mobile/modules/backup/providers/device_assets.provider.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/device_asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/app_state.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:photo_manager/photo_manager.dart';

class BackupNotifier extends StateNotifier<BackUpState> {
  BackupNotifier(
    this._backupService,
    this._serverInfoNotifier,
    this._authState,
    this._backgroundService,
    this._galleryPermissionNotifier,
    this._db,
    this.ref,
  ) : super(
          BackUpState(
            backupProgress: BackUpProgressEnum.idle,
            progressInPercentage: 0,
            cancelToken: CancellationToken(),
            currentUploadAsset: CurrentUploadAsset(
              id: '...',
              fileCreatedAt: DateTime.parse('2020-10-04'),
              fileName: '...',
              fileType: '...',
              iCloudAsset: false,
            ),
            iCloudDownloadProgress: 0.0,
          ),
        );

  final log = Logger('BackupNotifier');
  final BackupService _backupService;
  final ServerInfoNotifier _serverInfoNotifier;
  final AuthenticationState _authState;
  final BackgroundService _backgroundService;
  final GalleryPermissionNotifier _galleryPermissionNotifier;
  final Isar _db;
  final Ref ref;

  /// Invoke backup process
  Future<void> startBackupProcess() async {
    debugPrint("Start backup process");
    assert(state.backupProgress == BackUpProgressEnum.idle);
    state = state.copyWith(backupProgress: BackUpProgressEnum.inProgress);

    await _serverInfoNotifier.getServerDiskInfo();

    final hasPermission = _galleryPermissionNotifier.hasPermission;
    if (!hasPermission) {
      openAppSettings();
      return;
    }

    await PhotoManager.clearFileCache();

    final idsForBackup = await _db.deviceAssets
        .filter()
        .backupSelectionEqualTo(BackupSelection.select)
        .idProperty()
        .findAll();
    final localAssetsToBackup = await _db.assets
        .where()
        .remoteIdIsNull()
        .filter()
        .anyOf(idsForBackup, (q, id) => q.localIdEqualTo(id))
        .findAll();

    final assetsToBackup =
        await _backupService.remoteAlreadyUploaded(localAssetsToBackup);
    if (assetsToBackup.isEmpty) {
      log.info("No Asset On Device - Abort Backup Process");
      state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
      return;
    }

    // Perform Backup
    state = state.copyWith(cancelToken: CancellationToken());

    final pmProgressHandler = Platform.isIOS ? PMProgressHandler() : null;

    pmProgressHandler?.stream.listen((event) {
      final double progress = event.progress;
      state = state.copyWith(iCloudDownloadProgress: progress);
    });

    await _backupService.backupAsset(
      assetsToBackup,
      state.cancelToken,
      pmProgressHandler,
      _onAssetUploaded,
      _onUploadProgress,
      _onSetCurrentBackupAsset,
      _onBackupError,
    );

    state.cancelToken.cancel();
    state = state.copyWith(
      backupProgress: BackUpProgressEnum.idle,
      progressInPercentage: 0.0,
    );
    ref.invalidate(deviceAssetsProvider);
    await notifyBackgroundServiceCanRun();
  }

  void _onBackupError(ErrorUploadAsset errorAssetInfo) {
    ref.watch(errorBackupListProvider.notifier).add(errorAssetInfo);
  }

  void _onSetCurrentBackupAsset(CurrentUploadAsset currentUploadAsset) {
    state = state.copyWith(currentUploadAsset: currentUploadAsset);
  }

  void cancelBackup() {
    if (state.backupProgress != BackUpProgressEnum.inProgress) {
      notifyBackgroundServiceCanRun();
    }
    state.cancelToken.cancel();
    state = state.copyWith(
      backupProgress: BackUpProgressEnum.idle,
      progressInPercentage: 0.0,
    );
  }

  void _onAssetUploaded(
    String deviceAssetId,
    String deviceId,
    bool isDuplicated,
  ) {
    _serverInfoNotifier.getServerDiskInfo();
  }

  void _onUploadProgress(int sent, int total) {
    state = state.copyWith(
      progressInPercentage: (sent.toDouble() / total.toDouble() * 100),
    );
  }

  Future<void> _resumeBackup() async {
    // Check if user is login
    final accessKey = Store.tryGet(StoreKey.accessToken);

    // User has been logged out return
    if (accessKey == null || !_authState.isAuthenticated) {
      log.info("[_resumeBackup] not authenticated - abort");
      return;
    }

    // Check if this device is enable backup by the user
    if (ref.read(backupSettingsProvider).autoBackup) {
      // check if backup is already in process - then return
      if (state.backupProgress == BackUpProgressEnum.inProgress) {
        log.info("[_resumeBackup] Auto Backup is already in progress - abort");
        return;
      }

      if (state.backupProgress == BackUpProgressEnum.inBackground) {
        log.info("[_resumeBackup] Background backup is running - abort");
        return;
      }

      if (state.backupProgress == BackUpProgressEnum.manualInProgress) {
        log.info("[_resumeBackup] Manual upload is running - abort");
        return;
      }

      // Run backup
      log.info("[_resumeBackup] Start back up");
      await startBackupProcess();
    }
    return;
  }

  Future<void> resumeBackup() async {
    final BackUpProgressEnum previous = state.backupProgress;
    state = state.copyWith(backupProgress: BackUpProgressEnum.inBackground);

    // assumes the background service is currently running
    // if true, waits until it has stopped to start the backup
    final bool hasLock = await _backgroundService.acquireLock();
    if (hasLock) {
      state = state.copyWith(backupProgress: previous);
    }
    return _resumeBackup();
  }

  Future<void> notifyBackgroundServiceCanRun() async {
    const allowedStates = [
      AppStateEnum.inactive,
      AppStateEnum.paused,
      AppStateEnum.detached,
    ];
    if (allowedStates.contains(ref.read(appStateProvider.notifier).state)) {
      _backgroundService.releaseLock();
    }
  }

  BackUpProgressEnum get backupProgress => state.backupProgress;
  void updateBackupProgress(BackUpProgressEnum backupProgress) {
    state = state.copyWith(backupProgress: backupProgress);
  }
}

final backupProvider =
    StateNotifierProvider<BackupNotifier, BackUpState>((ref) {
  return BackupNotifier(
    ref.watch(backupServiceProvider),
    ref.watch(serverInfoProvider.notifier),
    ref.watch(authenticationProvider),
    ref.watch(backgroundServiceProvider),
    ref.watch(galleryPermissionNotifier.notifier),
    ref.watch(dbProvider),
    ref,
  );
});
