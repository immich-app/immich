import 'dart:io';

import 'package:cancellation_token_http/http.dart';
import 'package:collection/collection.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/backup/available_album.model.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';
import 'package:immich_mobile/models/backup/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/models/authentication/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/shared/providers/app_state.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:immich_mobile/utils/backup_progress.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:photo_manager/photo_manager.dart';

class BackupNotifier extends StateNotifier<BackUpState> {
  BackupNotifier(
    this._backupService,
    this._serverInfoService,
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
            progressInFileSize: "0 B / 0 B",
            progressInFileSpeed: 0,
            progressInFileSpeeds: const [],
            progressInFileSpeedUpdateTime: DateTime.now(),
            progressInFileSpeedUpdateSentBytes: 0,
            cancelToken: CancellationToken(),
            autoBackup: Store.get(StoreKey.autoBackup, false),
            backgroundBackup: Store.get(StoreKey.backgroundBackup, false),
            backupRequireWifi: Store.get(StoreKey.backupRequireWifi, true),
            backupRequireCharging:
                Store.get(StoreKey.backupRequireCharging, false),
            backupTriggerDelay: Store.get(StoreKey.backupTriggerDelay, 5000),
            serverInfo: const ServerDiskInfo(
              diskAvailable: "0",
              diskSize: "0",
              diskUse: "0",
              diskUsagePercentage: 0,
            ),
            availableAlbums: const [],
            selectedBackupAlbums: const {},
            excludedBackupAlbums: const {},
            allUniqueAssets: const {},
            selectedAlbumsBackupAssetsIds: const {},
            currentUploadAsset: CurrentUploadAsset(
              id: '...',
              fileCreatedAt: DateTime.parse('2020-10-04'),
              fileName: '...',
              fileType: '...',
              fileSize: 0,
              iCloudAsset: false,
            ),
            iCloudDownloadProgress: 0.0,
          ),
        );

  final log = Logger('BackupNotifier');
  final BackupService _backupService;
  final ServerInfoService _serverInfoService;
  final AuthenticationState _authState;
  final BackgroundService _backgroundService;
  final GalleryPermissionNotifier _galleryPermissionNotifier;
  final Isar _db;
  final Ref ref;

  ///
  /// UI INTERACTION
  ///
  /// Album selection
  /// Due to the overlapping assets across multiple albums on the device
  /// We have method to include and exclude albums
  /// The total unique assets will be used for backing mechanism
  ///
  void addAlbumForBackup(AvailableAlbum album) {
    if (state.excludedBackupAlbums.contains(album)) {
      removeExcludedAlbumForBackup(album);
    }

    state = state
        .copyWith(selectedBackupAlbums: {...state.selectedBackupAlbums, album});
  }

  void addExcludedAlbumForBackup(AvailableAlbum album) {
    if (state.selectedBackupAlbums.contains(album)) {
      removeAlbumForBackup(album);
    }
    state = state
        .copyWith(excludedBackupAlbums: {...state.excludedBackupAlbums, album});
  }

  void removeAlbumForBackup(AvailableAlbum album) {
    Set<AvailableAlbum> currentSelectedAlbums = state.selectedBackupAlbums;

    currentSelectedAlbums.removeWhere((a) => a == album);

    state = state.copyWith(selectedBackupAlbums: currentSelectedAlbums);
  }

  void removeExcludedAlbumForBackup(AvailableAlbum album) {
    Set<AvailableAlbum> currentExcludedAlbums = state.excludedBackupAlbums;

    currentExcludedAlbums.removeWhere((a) => a == album);

    state = state.copyWith(excludedBackupAlbums: currentExcludedAlbums);
  }

  Future<void> backupAlbumSelectionDone() {
    if (state.selectedBackupAlbums.isEmpty) {
      // disable any backup
      cancelBackup();
      setAutoBackup(false);
      configureBackgroundBackup(
        enabled: false,
        onError: (msg) {},
        onBatteryInfo: () {},
      );
    }
    return _updateBackupAssetCount();
  }

  void setAutoBackup(bool enabled) {
    Store.put(StoreKey.autoBackup, enabled);
    state = state.copyWith(autoBackup: enabled);
  }

  void configureBackgroundBackup({
    bool? enabled,
    bool? requireWifi,
    bool? requireCharging,
    int? triggerDelay,
    required void Function(String msg) onError,
    required void Function() onBatteryInfo,
  }) async {
    assert(
      enabled != null ||
          requireWifi != null ||
          requireCharging != null ||
          triggerDelay != null,
    );
    final bool wasEnabled = state.backgroundBackup;
    final bool wasWifi = state.backupRequireWifi;
    final bool wasCharging = state.backupRequireCharging;
    final int oldTriggerDelay = state.backupTriggerDelay;
    state = state.copyWith(
      backgroundBackup: enabled,
      backupRequireWifi: requireWifi,
      backupRequireCharging: requireCharging,
      backupTriggerDelay: triggerDelay,
    );

    if (state.backgroundBackup) {
      bool success = true;
      if (!wasEnabled) {
        if (!await _backgroundService.isIgnoringBatteryOptimizations()) {
          onBatteryInfo();
        }
        success &= await _backgroundService.enableService(immediate: true);
      }
      success &= success &&
          await _backgroundService.configureService(
            requireUnmetered: state.backupRequireWifi,
            requireCharging: state.backupRequireCharging,
            triggerUpdateDelay: state.backupTriggerDelay,
            triggerMaxDelay: state.backupTriggerDelay * 10,
          );
      if (success) {
        await Store.put(StoreKey.backupRequireWifi, state.backupRequireWifi);
        await Store.put(
          StoreKey.backupRequireCharging,
          state.backupRequireCharging,
        );
        await Store.put(StoreKey.backupTriggerDelay, state.backupTriggerDelay);
        await Store.put(StoreKey.backgroundBackup, state.backgroundBackup);
      } else {
        state = state.copyWith(
          backgroundBackup: wasEnabled,
          backupRequireWifi: wasWifi,
          backupRequireCharging: wasCharging,
          backupTriggerDelay: oldTriggerDelay,
        );
        onError("backup_controller_page_background_configure_error");
      }
    } else {
      final bool success = await _backgroundService.disableService();
      if (!success) {
        state = state.copyWith(backgroundBackup: wasEnabled);
        onError("backup_controller_page_background_configure_error");
      }
    }
  }

  ///
  /// Get all album on the device
  /// Get all selected and excluded album from the user's persistent storage
  /// If this is the first time performing backup - set the default selected album to be
  /// the one that has all assets (`Recent` on Android, `Recents` on iOS)
  ///
  Future<void> _getBackupAlbumsInfo() async {
    Stopwatch stopwatch = Stopwatch()..start();
    // Get all albums on the device
    List<AvailableAlbum> availableAlbums = [];
    List<AssetPathEntity> albums = await PhotoManager.getAssetPathList(
      hasAll: true,
      type: RequestType.common,
    );

    // Map of id -> album for quick album lookup later on.
    Map<String, AssetPathEntity> albumMap = {};

    log.info('Found ${albums.length} local albums');

    for (AssetPathEntity album in albums) {
      AvailableAlbum availableAlbum = AvailableAlbum(albumEntity: album);

      availableAlbums.add(availableAlbum);

      albumMap[album.id] = album;
    }
    state = state.copyWith(availableAlbums: availableAlbums);

    final List<BackupAlbum> excludedBackupAlbums =
        await _backupService.excludedAlbumsQuery().findAll();
    final List<BackupAlbum> selectedBackupAlbums =
        await _backupService.selectedAlbumsQuery().findAll();

    // Generate AssetPathEntity from id to add to local state
    final Set<AvailableAlbum> selectedAlbums = {};
    for (final BackupAlbum ba in selectedBackupAlbums) {
      final albumAsset = albumMap[ba.id];

      if (albumAsset != null) {
        selectedAlbums.add(
          AvailableAlbum(albumEntity: albumAsset, lastBackup: ba.lastBackup),
        );
      } else {
        log.severe('Selected album not found');
      }
    }

    final Set<AvailableAlbum> excludedAlbums = {};
    for (final BackupAlbum ba in excludedBackupAlbums) {
      final albumAsset = albumMap[ba.id];

      if (albumAsset != null) {
        excludedAlbums.add(
          AvailableAlbum(albumEntity: albumAsset, lastBackup: ba.lastBackup),
        );
      } else {
        log.severe('Excluded album not found');
      }
    }

    state = state.copyWith(
      selectedBackupAlbums: selectedAlbums,
      excludedBackupAlbums: excludedAlbums,
    );

    log.info(
      "_getBackupAlbumsInfo: Found ${availableAlbums.length} available albums",
    );
    debugPrint("_getBackupAlbumsInfo takes ${stopwatch.elapsedMilliseconds}ms");
  }

  ///
  /// From all the selected and albums assets
  /// Find the assets that are not overlapping between the two sets
  /// Those assets are unique and are used as the total assets
  ///
  Future<void> _updateBackupAssetCount() async {
    final duplicatedAssetIds = await _backupService.getDuplicatedAssetIds();
    final Set<AssetEntity> assetsFromSelectedAlbums = {};
    final Set<AssetEntity> assetsFromExcludedAlbums = {};

    for (final album in state.selectedBackupAlbums) {
      final assets = await album.albumEntity.getAssetListRange(
        start: 0,
        end: await album.albumEntity.assetCountAsync,
      );
      assetsFromSelectedAlbums.addAll(assets);
    }

    for (final album in state.excludedBackupAlbums) {
      final assets = await album.albumEntity.getAssetListRange(
        start: 0,
        end: await album.albumEntity.assetCountAsync,
      );
      assetsFromExcludedAlbums.addAll(assets);
    }

    final Set<AssetEntity> allUniqueAssets =
        assetsFromSelectedAlbums.difference(assetsFromExcludedAlbums);
    final allAssetsInDatabase = await _backupService.getDeviceBackupAsset();

    if (allAssetsInDatabase == null) {
      return;
    }

    // Find asset that were backup from selected albums
    final Set<String> selectedAlbumsBackupAssets =
        Set.from(allUniqueAssets.map((e) => e.id));

    selectedAlbumsBackupAssets
        .removeWhere((assetId) => !allAssetsInDatabase.contains(assetId));

    // Remove duplicated asset from all unique assets
    allUniqueAssets.removeWhere(
      (asset) => duplicatedAssetIds.contains(asset.id),
    );

    if (allUniqueAssets.isEmpty) {
      log.info("No assets are selected for back up");
      state = state.copyWith(
        backupProgress: BackUpProgressEnum.idle,
        allAssetsInDatabase: allAssetsInDatabase,
        allUniqueAssets: {},
        selectedAlbumsBackupAssetsIds: selectedAlbumsBackupAssets,
      );
    } else {
      state = state.copyWith(
        allAssetsInDatabase: allAssetsInDatabase,
        allUniqueAssets: allUniqueAssets,
        selectedAlbumsBackupAssetsIds: selectedAlbumsBackupAssets,
      );
    }

    // Save to persistent storage
    await _updatePersistentAlbumsSelection();
  }

  /// Get all necessary information for calculating the available albums,
  /// which albums are selected or excluded
  /// and then update the UI according to those information
  Future<void> getBackupInfo() async {
    final isEnabled = await _backgroundService.isBackgroundBackupEnabled();

    state = state.copyWith(backgroundBackup: isEnabled);
    if (isEnabled != Store.get(StoreKey.backgroundBackup, !isEnabled)) {
      Store.put(StoreKey.backgroundBackup, isEnabled);
    }

    if (state.backupProgress != BackUpProgressEnum.inBackground) {
      await _getBackupAlbumsInfo();
      await updateServerInfo();
      await _updateBackupAssetCount();
    } else {
      log.warning("cannot get backup info - background backup is in progress!");
    }
  }

  /// Save user selection of selected albums and excluded albums to database
  Future<void> _updatePersistentAlbumsSelection() {
    final epoch = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
    final selected = state.selectedBackupAlbums.map(
      (e) => BackupAlbum(e.id, e.lastBackup ?? epoch, BackupSelection.select),
    );
    final excluded = state.excludedBackupAlbums.map(
      (e) => BackupAlbum(e.id, e.lastBackup ?? epoch, BackupSelection.exclude),
    );
    final backupAlbums = selected.followedBy(excluded).toList();
    backupAlbums.sortBy((e) => e.id);
    return _db.writeTxn(() async {
      final dbAlbums = await _db.backupAlbums.where().sortById().findAll();
      final List<int> toDelete = [];
      final List<BackupAlbum> toUpsert = [];
      // stores the most recent `lastBackup` per album but always keeps the `selection` the user just made
      diffSortedListsSync(
        dbAlbums,
        backupAlbums,
        compare: (BackupAlbum a, BackupAlbum b) => a.id.compareTo(b.id),
        both: (BackupAlbum a, BackupAlbum b) {
          b.lastBackup =
              a.lastBackup.isAfter(b.lastBackup) ? a.lastBackup : b.lastBackup;
          toUpsert.add(b);
          return true;
        },
        onlyFirst: (BackupAlbum a) => toDelete.add(a.isarId),
        onlySecond: (BackupAlbum b) => toUpsert.add(b),
      );
      await _db.backupAlbums.deleteAll(toDelete);
      await _db.backupAlbums.putAll(toUpsert);
    });
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

  void setAvailableAlbums(availableAlbums) {
    state = state.copyWith(
      availableAlbums: availableAlbums,
    );
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
      progressInFileSize: "0 B / 0 B",
      progressInFileSpeed: 0,
      progressInFileSpeedUpdateTime: DateTime.now(),
      progressInFileSpeedUpdateSentBytes: 0,
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
            .where((asset) => asset.id != deviceAssetId)
            .toSet(),
      );
    } else {
      state = state.copyWith(
        selectedAlbumsBackupAssetsIds: {
          ...state.selectedAlbumsBackupAssetsIds,
          deviceAssetId,
        },
        allAssetsInDatabase: [...state.allAssetsInDatabase, deviceAssetId],
      );
    }

    if (state.allUniqueAssets.length -
            state.selectedAlbumsBackupAssetsIds.length ==
        0) {
      final latestAssetBackup =
          state.allUniqueAssets.map((e) => e.modifiedDateTime).reduce(
                (v, e) => e.isAfter(v) ? e : v,
              );
      state = state.copyWith(
        selectedBackupAlbums: state.selectedBackupAlbums
            .map((e) => e.copyWith(lastBackup: latestAssetBackup))
            .toSet(),
        excludedBackupAlbums: state.excludedBackupAlbums
            .map((e) => e.copyWith(lastBackup: latestAssetBackup))
            .toSet(),
        backupProgress: BackUpProgressEnum.done,
        progressInPercentage: 0.0,
        progressInFileSize: "0 B / 0 B",
        progressInFileSpeed: 0,
        progressInFileSpeedUpdateTime: DateTime.now(),
        progressInFileSpeedUpdateSentBytes: 0,
      );
      _updatePersistentAlbumsSelection();
    }

    updateServerInfo();
  }

  void _onUploadProgress(int sent, int total) {
    double lastUploadSpeed = state.progressInFileSpeed;
    List<double> lastUploadSpeeds = state.progressInFileSpeeds.toList();
    DateTime lastUpdateTime = state.progressInFileSpeedUpdateTime;
    int lastSentBytes = state.progressInFileSpeedUpdateSentBytes;

    final now = DateTime.now();
    final duration = now.difference(lastUpdateTime);

    // Keep the upload speed average span limited, to keep it somewhat relevant
    if (lastUploadSpeeds.length > 10) {
      lastUploadSpeeds.removeAt(0);
    }

    if (duration.inSeconds > 0) {
      lastUploadSpeeds.add(
        ((sent - lastSentBytes) / duration.inSeconds).abs().roundToDouble(),
      );

      lastUploadSpeed = lastUploadSpeeds.average.abs().roundToDouble();
      lastUpdateTime = now;
      lastSentBytes = sent;
    }

    state = state.copyWith(
      progressInPercentage: (sent.toDouble() / total.toDouble() * 100),
      progressInFileSize: humanReadableFileBytesProgress(sent, total),
      progressInFileSpeed: lastUploadSpeed,
      progressInFileSpeeds: lastUploadSpeeds,
      progressInFileSpeedUpdateTime: lastUpdateTime,
      progressInFileSpeedUpdateSentBytes: lastSentBytes,
    );
  }

  Future<void> updateServerInfo() async {
    final serverInfo = await _serverInfoService.getServerInfo();

    // Update server info
    if (serverInfo != null) {
      state = state.copyWith(
        serverInfo: serverInfo,
      );
    }
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
    if (state.autoBackup) {
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
    final List<BackupAlbum> selectedBackupAlbums = await _db.backupAlbums
        .filter()
        .selectionEqualTo(BackupSelection.select)
        .findAll();
    final List<BackupAlbum> excludedBackupAlbums = await _db.backupAlbums
        .filter()
        .selectionEqualTo(BackupSelection.exclude)
        .findAll();
    Set<AvailableAlbum> selectedAlbums = state.selectedBackupAlbums;
    Set<AvailableAlbum> excludedAlbums = state.excludedBackupAlbums;
    if (selectedAlbums.isNotEmpty) {
      selectedAlbums = _updateAlbumsBackupTime(
        selectedAlbums,
        selectedBackupAlbums,
      );
    }

    if (excludedAlbums.isNotEmpty) {
      excludedAlbums = _updateAlbumsBackupTime(
        excludedAlbums,
        excludedBackupAlbums,
      );
    }
    final BackUpProgressEnum previous = state.backupProgress;
    state = state.copyWith(
      backupProgress: BackUpProgressEnum.inBackground,
      selectedBackupAlbums: selectedAlbums,
      excludedBackupAlbums: excludedAlbums,
    );
    // assumes the background service is currently running
    // if true, waits until it has stopped to start the backup
    final bool hasLock = await _backgroundService.acquireLock();
    if (hasLock) {
      state = state.copyWith(backupProgress: previous);
    }
    return _resumeBackup();
  }

  Set<AvailableAlbum> _updateAlbumsBackupTime(
    Set<AvailableAlbum> albums,
    List<BackupAlbum> backupAlbums,
  ) {
    Set<AvailableAlbum> result = {};
    for (BackupAlbum ba in backupAlbums) {
      try {
        AvailableAlbum a = albums.firstWhere((e) => e.id == ba.id);
        result.add(a.copyWith(lastBackup: ba.lastBackup));
      } on StateError {
        log.severe(
          "[_updateAlbumBackupTime] failed to find album in state",
          "State Error",
          StackTrace.current,
        );
      }
    }
    return result;
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
    ref.watch(serverInfoServiceProvider),
    ref.watch(authenticationProvider),
    ref.watch(backgroundServiceProvider),
    ref.watch(galleryPermissionNotifier.notifier),
    ref.watch(dbProvider),
    ref,
  );
});
