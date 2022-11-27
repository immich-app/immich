import 'dart:io';

import 'package:cancellation_token_http/http.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/models/available_album.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_duplicated_assets.model.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/providers/app_state.provider.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

class BackupNotifier extends StateNotifier<BackUpState> {
  BackupNotifier(
    this._backupService,
    this._serverInfoService,
    this._authState,
    this._backgroundService,
    this.ref,
  ) : super(
          BackUpState(
            backupProgress: BackUpProgressEnum.idle,
            allAssetsInDatabase: const [],
            progressInPercentage: 0,
            cancelToken: CancellationToken(),
            backgroundBackup: false,
            backupRequireWifi: true,
            backupRequireCharging: false,
            serverInfo: ServerInfoResponseDto(
              diskAvailable: "0",
              diskAvailableRaw: 0,
              diskSize: "0",
              diskSizeRaw: 0,
              diskUsagePercentage: 0,
              diskUse: "0",
              diskUseRaw: 0,
            ),
            availableAlbums: const [],
            selectedBackupAlbums: const {},
            excludedBackupAlbums: const {},
            allUniqueAssets: const {},
            selectedAlbumsBackupAssetsIds: const {},
            currentUploadAsset: CurrentUploadAsset(
              id: '...',
              createdAt: DateTime.parse('2020-10-04'),
              fileName: '...',
              fileType: '...',
            ),
          ),
        ) {
    getBackupInfo();
  }

  final log = Logger('BackupNotifier');
  final BackupService _backupService;
  final ServerInfoService _serverInfoService;
  final AuthenticationState _authState;
  final BackgroundService _backgroundService;
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
    _updateBackupAssetCount();
  }

  void addExcludedAlbumForBackup(AvailableAlbum album) {
    if (state.selectedBackupAlbums.contains(album)) {
      removeAlbumForBackup(album);
    }
    state = state
        .copyWith(excludedBackupAlbums: {...state.excludedBackupAlbums, album});
    _updateBackupAssetCount();
  }

  void removeAlbumForBackup(AvailableAlbum album) {
    Set<AvailableAlbum> currentSelectedAlbums = state.selectedBackupAlbums;

    currentSelectedAlbums.removeWhere((a) => a == album);

    state = state.copyWith(selectedBackupAlbums: currentSelectedAlbums);
    _updateBackupAssetCount();
  }

  void removeExcludedAlbumForBackup(AvailableAlbum album) {
    Set<AvailableAlbum> currentExcludedAlbums = state.excludedBackupAlbums;

    currentExcludedAlbums.removeWhere((a) => a == album);

    state = state.copyWith(excludedBackupAlbums: currentExcludedAlbums);
    _updateBackupAssetCount();
  }

  void configureBackgroundBackup({
    bool? enabled,
    bool? requireWifi,
    bool? requireCharging,
    required void Function(String msg) onError,
    required void Function() onBatteryInfo,
  }) async {
    assert(enabled != null || requireWifi != null || requireCharging != null);
    if (Platform.isAndroid) {
      final bool wasEnabled = state.backgroundBackup;
      final bool wasWifi = state.backupRequireWifi;
      final bool wasCharing = state.backupRequireCharging;
      state = state.copyWith(
        backgroundBackup: enabled,
        backupRequireWifi: requireWifi,
        backupRequireCharging: requireCharging,
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
            );
        if (success) {
          await Hive.box(backgroundBackupInfoBox)
              .put(backupRequireWifi, state.backupRequireWifi);
          await Hive.box(backgroundBackupInfoBox)
              .put(backupRequireCharging, state.backupRequireCharging);
        } else {
          state = state.copyWith(
            backgroundBackup: wasEnabled,
            backupRequireWifi: wasWifi,
            backupRequireCharging: wasCharing,
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
  }

  ///
  /// Get all album on the device
  /// Get all selected and excluded album from the user's persistent storage
  /// If this is the first time performing backup - set the default selected album to be
  /// the one that has all assets (Recent on Android, Recents on iOS)
  ///
  Future<void> _getBackupAlbumsInfo() async {
    // Get all albums on the device
    List<AvailableAlbum> availableAlbums = [];
    List<AssetPathEntity> albums = await PhotoManager.getAssetPathList(
      hasAll: true,
      type: RequestType.common,
    );

    for (AssetPathEntity album in albums) {
      AvailableAlbum availableAlbum = AvailableAlbum(albumEntity: album);

      var assetCountInAlbum = await album.assetCountAsync;
      if (assetCountInAlbum > 0) {
        var assetList =
            await album.getAssetListRange(start: 0, end: assetCountInAlbum);

        if (assetList.isNotEmpty) {
          var thumbnailAsset = assetList.first;
          var thumbnailData = await thumbnailAsset
              .thumbnailDataWithSize(const ThumbnailSize(512, 512));
          availableAlbum =
              availableAlbum.copyWith(thumbnailData: thumbnailData);
        }

        availableAlbums.add(availableAlbum);
      }
    }

    state = state.copyWith(availableAlbums: availableAlbums);

    // Put persistent storage info into local state of the app
    // Get local storage on selected backup album
    Box<HiveBackupAlbums> backupAlbumInfoBox =
        Hive.box<HiveBackupAlbums>(hiveBackupInfoBox);
    HiveBackupAlbums? backupAlbumInfo = backupAlbumInfoBox.get(
      backupInfoKey,
      defaultValue: HiveBackupAlbums(
        selectedAlbumIds: [],
        excludedAlbumsIds: [],
        lastSelectedBackupTime: [],
        lastExcludedBackupTime: [],
      ),
    );

    if (backupAlbumInfo == null) {
      log.severe(
        "backupAlbumInfo == null",
        "Failed to get Hive backup album information",
      );
      return;
    }

    // First time backup - set isAll album is the default one for backup.
    if (backupAlbumInfo.selectedAlbumIds.isEmpty) {
      log.info("First time backup; setup 'Recent(s)' album as default");

      // Get album that contains all assets
      var list = await PhotoManager.getAssetPathList(
        hasAll: true,
        onlyAll: true,
        type: RequestType.common,
      );

      if (list.isEmpty) {
        return;
      }
      AssetPathEntity albumHasAllAssets = list.first;

      backupAlbumInfoBox.put(
        backupInfoKey,
        HiveBackupAlbums(
          selectedAlbumIds: [albumHasAllAssets.id],
          excludedAlbumsIds: [],
          lastSelectedBackupTime: [
            DateTime.fromMillisecondsSinceEpoch(0, isUtc: true)
          ],
          lastExcludedBackupTime: [],
        ),
      );

      backupAlbumInfo = backupAlbumInfoBox.get(backupInfoKey);
    }

    // Generate AssetPathEntity from id to add to local state
    try {
      Set<AvailableAlbum> selectedAlbums = {};
      for (var i = 0; i < backupAlbumInfo!.selectedAlbumIds.length; i++) {
        var albumAsset =
            await AssetPathEntity.fromId(backupAlbumInfo.selectedAlbumIds[i]);
        selectedAlbums.add(
          AvailableAlbum(
            albumEntity: albumAsset,
            lastBackup: backupAlbumInfo.lastSelectedBackupTime.length > i
                ? backupAlbumInfo.lastSelectedBackupTime[i]
                : DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
          ),
        );
      }

      Set<AvailableAlbum> excludedAlbums = {};
      for (var i = 0; i < backupAlbumInfo.excludedAlbumsIds.length; i++) {
        var albumAsset =
            await AssetPathEntity.fromId(backupAlbumInfo.excludedAlbumsIds[i]);
        excludedAlbums.add(
          AvailableAlbum(
            albumEntity: albumAsset,
            lastBackup: backupAlbumInfo.lastExcludedBackupTime.length > i
                ? backupAlbumInfo.lastExcludedBackupTime[i]
                : DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
          ),
        );
      }
      state = state.copyWith(
        selectedBackupAlbums: selectedAlbums,
        excludedBackupAlbums: excludedAlbums,
      );
    } catch (e, stackTrace) {
      log.severe("Failed to generate album from id", e, stackTrace);
    }
  }

  ///
  /// From all the selected and albums assets
  /// Find the assets that are not overlapping between the two sets
  /// Those assets are unique and are used as the total assets
  ///
  Future<void> _updateBackupAssetCount() async {
    Set<String> duplicatedAssetIds = _backupService.getDuplicatedAssetIds();
    Set<AssetEntity> assetsFromSelectedAlbums = {};
    Set<AssetEntity> assetsFromExcludedAlbums = {};

    for (var album in state.selectedBackupAlbums) {
      var assets = await album.albumEntity.getAssetListRange(
        start: 0,
        end: await album.albumEntity.assetCountAsync,
      );
      assetsFromSelectedAlbums.addAll(assets);
    }

    for (var album in state.excludedBackupAlbums) {
      var assets = await album.albumEntity.getAssetListRange(
        start: 0,
        end: await album.albumEntity.assetCountAsync,
      );
      assetsFromExcludedAlbums.addAll(assets);
    }

    Set<AssetEntity> allUniqueAssets =
        assetsFromSelectedAlbums.difference(assetsFromExcludedAlbums);
    var allAssetsInDatabase = await _backupService.getDeviceBackupAsset();

    if (allAssetsInDatabase == null) {
      return;
    }

    // Find asset that were backup from selected albums
    Set<String> selectedAlbumsBackupAssets =
        Set.from(allUniqueAssets.map((e) => e.id));

    selectedAlbumsBackupAssets
        .removeWhere((assetId) => !allAssetsInDatabase.contains(assetId));

    // Remove duplicated asset from all unique assets
    allUniqueAssets.removeWhere(
      (asset) => duplicatedAssetIds.contains(asset.id),
    );

    if (allUniqueAssets.isEmpty) {
      log.info("Not found albums or assets on the device to backup");
      state = state.copyWith(
        backupProgress: BackUpProgressEnum.idle,
        allAssetsInDatabase: allAssetsInDatabase,
        allUniqueAssets: {},
        selectedAlbumsBackupAssetsIds: selectedAlbumsBackupAssets,
      );
      return;
    } else {
      state = state.copyWith(
        allAssetsInDatabase: allAssetsInDatabase,
        allUniqueAssets: allUniqueAssets,
        selectedAlbumsBackupAssetsIds: selectedAlbumsBackupAssets,
      );
    }

    // Save to persistent storage
    _updatePersistentAlbumsSelection();

    return;
  }

  ///
  /// Get all necessary information for calculating the available albums,
  /// which albums are selected or excluded
  /// and then update the UI according to those information
  ///
  Future<void> getBackupInfo() async {
    final bool isEnabled = await _backgroundService.isBackgroundBackupEnabled();
    state = state.copyWith(backgroundBackup: isEnabled);
    if (state.backupProgress != BackUpProgressEnum.inBackground) {
      await _getBackupAlbumsInfo();
      await _updateServerInfo();
      await _updateBackupAssetCount();
    }
  }

  ///
  /// Save user selection of selected albums and excluded albums to
  /// Hive database
  ///
  void _updatePersistentAlbumsSelection() {
    final epoch = DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
    Box<HiveBackupAlbums> backupAlbumInfoBox =
        Hive.box<HiveBackupAlbums>(hiveBackupInfoBox);
    backupAlbumInfoBox.put(
      backupInfoKey,
      HiveBackupAlbums(
        selectedAlbumIds: state.selectedBackupAlbums.map((e) => e.id).toList(),
        excludedAlbumsIds: state.excludedBackupAlbums.map((e) => e.id).toList(),
        lastSelectedBackupTime: state.selectedBackupAlbums
            .map((e) => e.lastBackup ?? epoch)
            .toList(),
        lastExcludedBackupTime: state.excludedBackupAlbums
            .map((e) => e.lastBackup ?? epoch)
            .toList(),
      ),
    );
  }

  ///
  /// Invoke backup process
  ///
  Future<void> startBackupProcess() async {
    assert(state.backupProgress == BackUpProgressEnum.idle);
    state = state.copyWith(backupProgress: BackUpProgressEnum.inProgress);

    await getBackupInfo();

    var authResult = await PhotoManager.requestPermissionExtend();
    if (authResult.isAuth) {
      await PhotoManager.clearFileCache();

      if (state.allUniqueAssets.isEmpty) {
        log.info("No Asset On Device - Abort Backup Process");
        state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
        return;
      }

      Set<AssetEntity> assetsWillBeBackup = Set.from(state.allUniqueAssets);

      // Remove item that has already been backed up
      for (var assetId in state.allAssetsInDatabase) {
        assetsWillBeBackup.removeWhere((e) => e.id == assetId);
      }

      if (assetsWillBeBackup.isEmpty) {
        state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
      }

      // Perform Backup
      state = state.copyWith(cancelToken: CancellationToken());
      await _backupService.backupAsset(
        assetsWillBeBackup,
        state.cancelToken,
        _onAssetUploaded,
        _onUploadProgress,
        _onSetCurrentBackupAsset,
        _onBackupError,
      );
      await _notifyBackgroundServiceCanRun();
    } else {
      PhotoManager.openSetting();
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
      _notifyBackgroundServiceCanRun();
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
            .where((asset) => asset.id != deviceAssetId)
            .toSet(),
      );
    } else {
      state = state.copyWith(
        selectedAlbumsBackupAssetsIds: {
          ...state.selectedAlbumsBackupAssetsIds,
          deviceAssetId
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
      );
      _updatePersistentAlbumsSelection();
    }

    _updateServerInfo();
  }

  void _onUploadProgress(int sent, int total) {
    state = state.copyWith(
      progressInPercentage: (sent.toDouble() / total.toDouble() * 100),
    );
  }

  Future<void> _updateServerInfo() async {
    var serverInfo = await _serverInfoService.getServerInfo();

    // Update server info
    if (serverInfo != null) {
      state = state.copyWith(
        serverInfo: serverInfo,
      );
    }
  }

  Future<void> _resumeBackup() async {
    // Check if user is login
    var accessKey = Hive.box(userInfoBox).get(accessTokenKey);

    // User has been logged out return
    if (accessKey == null || !_authState.isAuthenticated) {
      log.info("[_resumeBackup] not authenticated - abort");
      return;
    }

    // Check if this device is enable backup by the user
    if ((_authState.deviceInfo.deviceId == _authState.deviceId) &&
        _authState.deviceInfo.isAutoBackup) {
      // check if backup is alreayd in process - then return
      if (state.backupProgress == BackUpProgressEnum.inProgress) {
        log.info("[_resumeBackup] Backup is already in progress - abort");
        return;
      }

      if (state.backupProgress == BackUpProgressEnum.inBackground) {
        log.info("[_resumeBackup] Background backup is running - abort");
        return;
      }

      // Run backup
      log.info("[_resumeBackup] Start back up");
      await startBackupProcess();
    }

    return;
  }

  Future<void> resumeBackup() async {
    if (Platform.isAndroid) {
      // assumes the background service is currently running
      // if true, waits until it has stopped to update the app state from HiveDB
      // before actually resuming backup by calling the internal `_resumeBackup`
      final BackUpProgressEnum previous = state.backupProgress;
      state = state.copyWith(backupProgress: BackUpProgressEnum.inBackground);
      final bool hasLock = await _backgroundService.acquireLock();
      if (!hasLock) {
        log.warning("WARNING [resumeBackup] failed to acquireLock");
        return;
      }
      await Future.wait([
        Hive.openBox<HiveBackupAlbums>(hiveBackupInfoBox),
        Hive.openBox<HiveDuplicatedAssets>(duplicatedAssetsBox),
        Hive.openBox(backgroundBackupInfoBox),
      ]);
      final HiveBackupAlbums? albums =
          Hive.box<HiveBackupAlbums>(hiveBackupInfoBox).get(backupInfoKey);
      Set<AvailableAlbum> selectedAlbums = state.selectedBackupAlbums;
      Set<AvailableAlbum> excludedAlbums = state.excludedBackupAlbums;
      if (albums != null) {
        selectedAlbums = _updateAlbumsBackupTime(
          selectedAlbums,
          albums.selectedAlbumIds,
          albums.lastSelectedBackupTime,
        );
        excludedAlbums = _updateAlbumsBackupTime(
          excludedAlbums,
          albums.excludedAlbumsIds,
          albums.lastExcludedBackupTime,
        );
      }
      final Box backgroundBox = Hive.box(backgroundBackupInfoBox);
      state = state.copyWith(
        backupProgress: previous,
        selectedBackupAlbums: selectedAlbums,
        excludedBackupAlbums: excludedAlbums,
        backupRequireWifi: backgroundBox.get(backupRequireWifi),
        backupRequireCharging: backgroundBox.get(backupRequireCharging),
      );
    }
    return _resumeBackup();
  }

  Set<AvailableAlbum> _updateAlbumsBackupTime(
    Set<AvailableAlbum> albums,
    List<String> ids,
    List<DateTime> times,
  ) {
    Set<AvailableAlbum> result = {};
    for (int i = 0; i < ids.length; i++) {
      try {
        AvailableAlbum a = albums.firstWhere((e) => e.id == ids[i]);
        result.add(a.copyWith(lastBackup: times[i]));
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

  Future<void> _notifyBackgroundServiceCanRun() async {
    const allowedStates = [
      AppStateEnum.inactive,
      AppStateEnum.paused,
      AppStateEnum.detached,
    ];
    if (Platform.isAndroid &&
        allowedStates.contains(ref.read(appStateProvider.notifier).state)) {
      try {
        if (Hive.isBoxOpen(hiveBackupInfoBox)) {
          await Hive.box<HiveBackupAlbums>(hiveBackupInfoBox).close();
        }
      } catch (error) {
        log.info("[_notifyBackgroundServiceCanRun] failed to close box");
      }
      try {
        if (Hive.isBoxOpen(duplicatedAssetsBox)) {
          await Hive.box<HiveDuplicatedAssets>(duplicatedAssetsBox).close();
        }
      } catch (error, stackTrace) {
        log.severe(
          "[_notifyBackgroundServiceCanRun] failed to close box",
          error,
          stackTrace,
        );
      }
      try {
        if (Hive.isBoxOpen(backgroundBackupInfoBox)) {
          await Hive.box(backgroundBackupInfoBox).close();
        }
      } catch (error, stackTrace) {
        log.severe(
          "[_notifyBackgroundServiceCanRun] failed to close box",
          error,
          stackTrace,
        );
      }
      _backgroundService.releaseLock();
    }
  }
}

final backupProvider =
    StateNotifierProvider<BackupNotifier, BackUpState>((ref) {
  return BackupNotifier(
    ref.watch(backupServiceProvider),
    ref.watch(serverInfoServiceProvider),
    ref.watch(authenticationProvider),
    ref.watch(backgroundServiceProvider),
    ref,
  );
});
