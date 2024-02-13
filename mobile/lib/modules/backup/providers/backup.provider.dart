import 'dart:io';

import 'package:cancellation_token_http/http.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup_album.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup_settings.provider.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
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
            allAssetsInDatabase: const [],
            progressInPercentage: 0,
            cancelToken: CancellationToken(),
            allUniqueAssets: const {},
            backedUpAssetsCount: 0,
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

  ///
  /// From all the selected and albums assets
  /// Find the assets that are not overlapping between the two sets
  /// Those assets are unique and are used as the total assets
  ///
  Future<void> _updateBackupAssetCount() async {
    final duplicatedAssetIds = await _backupService.getDuplicatedAssetIds();
    final backupAlbums = await ref.read(backupAlbumsProvider.future);
    final Set<Asset> assetsFromSelectedAlbums = {};
    final Set<Asset> assetsFromExcludedAlbums = {};

    for (final selected in backupAlbums.selectedBackupAlbums) {
      assetsFromSelectedAlbums.addAll(selected.album.value?.assets ?? []);
    }

    for (final excluded in backupAlbums.excludedBackupAlbums) {
      assetsFromExcludedAlbums.addAll(excluded.album.value?.assets ?? []);
    }

    final Set<Asset> allUniqueAssets =
        assetsFromSelectedAlbums.difference(assetsFromExcludedAlbums);
    final allAssetsInDatabase = await _backupService.getDeviceBackupAsset();

    if (allAssetsInDatabase == null) {
      return;
    }

    // Find asset that were backup from selected albums
    final Set<String> selectedAlbumsBackupAssets =
        allUniqueAssets.map((e) => e.localId).nonNulls.toSet();

    selectedAlbumsBackupAssets
        .removeWhere((assetId) => !allAssetsInDatabase.contains(assetId));

    // Remove duplicated asset from all unique assets
    allUniqueAssets
        .removeWhere((asset) => duplicatedAssetIds.contains(asset.localId));

    if (allUniqueAssets.isEmpty) {
      log.fine("No assets are selected for back up");
      state = state.copyWith(
        backupProgress: BackUpProgressEnum.idle,
        allAssetsInDatabase: allAssetsInDatabase,
        allUniqueAssets: {},
        backedUpAssetsCount: selectedAlbumsBackupAssets.length,
      );
    } else {
      state = state.copyWith(
        allAssetsInDatabase: allAssetsInDatabase,
        allUniqueAssets: allUniqueAssets,
        backedUpAssetsCount: selectedAlbumsBackupAssets.length,
      );
    }
  }

  /// Get all necessary information for calculating the available albums,
  /// which albums are selected or excluded
  /// and then update the UI according to those information
  Future<void> getBackupInfo() async {
    final isEnabled = await _backgroundService.isBackgroundBackupEnabled();
    // TODO: Check this
    // state = state.copyWith(backgroundBackup: isEnabled);
    if (isEnabled != Store.get(StoreKey.backgroundBackup, !isEnabled)) {
      Store.put(StoreKey.backgroundBackup, isEnabled);
    }

    if (state.backupProgress != BackUpProgressEnum.inBackground) {
      await _serverInfoNotifier.getServerDiskInfo();
      await _updateBackupAssetCount();
    } else {
      log.warning("cannot get backup info - background backup is in progress!");
    }
  }

  /// Invoke backup process
  Future<void> startBackupProcess() async {
    debugPrint("Start backup process");
    assert(state.backupProgress == BackUpProgressEnum.idle);
    state = state.copyWith(backupProgress: BackUpProgressEnum.inProgress);

    await getBackupInfo();

    final hasPermission = _galleryPermissionNotifier.hasPermission;
    if (hasPermission) {
      await PhotoManager.clearFileCache();

      if (state.allUniqueAssets.isEmpty) {
        log.info("No Asset On Device - Abort Backup Process");
        state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
        return;
      }

      Set<AssetEntity> assetsWillBeBackup = Set.from(state.allUniqueAssets);
      // Remove item that has already been backed up
      for (final assetId in state.allAssetsInDatabase) {
        assetsWillBeBackup.removeWhere((e) => e.id == assetId);
      }

      if (assetsWillBeBackup.isEmpty) {
        state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
      }

      // Perform Backup
      state = state.copyWith(cancelToken: CancellationToken());

      final pmProgressHandler = Platform.isIOS ? PMProgressHandler() : null;

      pmProgressHandler?.stream.listen((event) {
        final double progress = event.progress;
        state = state.copyWith(iCloudDownloadProgress: progress);
      });

      await _backupService.backupAsset(
        assetsWillBeBackup,
        state.cancelToken,
        pmProgressHandler,
        _onAssetUploaded,
        _onUploadProgress,
        _onSetCurrentBackupAsset,
        _onBackupError,
      );
      await notifyBackgroundServiceCanRun();
    } else {
      openAppSettings();
    }
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
    if (isDuplicated) {
      state = state.copyWith(
        allUniqueAssets: state.allUniqueAssets
            .where((asset) => asset.localId != deviceAssetId)
            .toSet(),
      );
    } else {
      state = state.copyWith(
        backedUpAssetsCount: state.backedUpAssetsCount + 1,
        allAssetsInDatabase: [...state.allAssetsInDatabase, deviceAssetId],
      );
    }

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

    // TODO: update album specific last backup time
    final backupAlbums = await ref.read(backupAlbumsProvider.future);
    List<BackupAlbum> selectedAlbums = backupAlbums.selectedBackupAlbums
        .followedBy(backupAlbums.excludedBackupAlbums)
        .map((e) {
      e.lastBackup = DateTime.now();
      return e;
    }).toList();
    await _db.writeTxn(() => _db.backupAlbums.putAll(selectedAlbums));

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
