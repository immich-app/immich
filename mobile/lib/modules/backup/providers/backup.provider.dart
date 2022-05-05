import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/models/available_album.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/shared/models/server_info.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:photo_manager/photo_manager.dart';

class BackupNotifier extends StateNotifier<BackUpState> {
  BackupNotifier({this.ref})
      : super(
          BackUpState(
            backupProgress: BackUpProgressEnum.idle,
            backingUpAssetCount: 0,
            assetOnDatabase: 0,
            totalAssetCount: 0,
            progressInPercentage: 0,
            cancelToken: CancelToken(),
            serverInfo: ServerInfo(
              diskAvailable: "0",
              diskAvailableRaw: 0,
              diskSize: "0",
              diskSizeRaw: 0,
              diskUsagePercentage: 0.0,
              diskUse: "0",
              diskUseRaw: 0,
            ),
            availableAlbums: const [],
            selectedBackupAlbums: const {},
            excludedBackupAlbums: const {},
          ),
        );

  Ref? ref;
  final BackupService _backupService = BackupService();
  final ServerInfoService _serverInfoService = ServerInfoService();

  /// Album selection
  /// Due to the overlapping assets across multiple albums on the device
  /// We have method to include and exclude albums
  /// The total unique assets will be used for backing mechanism
  void addAlbumForBackup(AssetPathEntity album) {
    if (state.excludedBackupAlbums.contains(album)) {
      removeExcludedAlbumForBackup(album);
    }

    state = state.copyWith(selectedBackupAlbums: {...state.selectedBackupAlbums, album});

    // TODO - Save to persistent storage
  }

  void addExcludedAlbumForBackup(AssetPathEntity album) {
    if (state.selectedBackupAlbums.contains(album)) {
      removeAlbumForBackup(album);
    }
    state = state.copyWith(excludedBackupAlbums: {...state.excludedBackupAlbums, album});

    // TODO - Save to persistent storage
  }

  void removeAlbumForBackup(AssetPathEntity album) {
    Set<AssetPathEntity> currentSelectedAlbums = state.selectedBackupAlbums;

    currentSelectedAlbums.removeWhere((a) => a == album);

    state = state.copyWith(selectedBackupAlbums: currentSelectedAlbums);

    // TODO - Save to persistent storage
  }

  void removeExcludedAlbumForBackup(AssetPathEntity album) {
    Set<AssetPathEntity> currentExcludedAlbums = state.excludedBackupAlbums;

    currentExcludedAlbums.removeWhere((a) => a == album);

    state = state.copyWith(excludedBackupAlbums: currentExcludedAlbums);

    // TODO - Save to persistent storage
  }

  void getAlbumsOnDevice() async {
    // Get all albums on the device
    List<AvailableAlbum> availableAlbums = [];
    List<AssetPathEntity> albums = await PhotoManager.getAssetPathList(hasAll: true, type: RequestType.common);

    for (AssetPathEntity album in albums) {
      AvailableAlbum availableAlbum = AvailableAlbum(albumEntity: album);

      var assetList = await album.getAssetListRange(start: 0, end: album.assetCount);

      if (assetList.isNotEmpty) {
        var thumbnailAsset = assetList.first;
        var thumbnailData = await thumbnailAsset.thumbnailDataWithSize(const ThumbnailSize(512, 512));
        availableAlbum = availableAlbum.copyWith(thumbnailData: thumbnailData);
      }

      availableAlbums.add(availableAlbum);
    }

    state = state.copyWith(availableAlbums: availableAlbums);

    // Put persistent storage info into local state of the app
    // Get local storage on selected backup album
    Box<HiveBackupAlbums> backupAlbumInfoBox = Hive.box<HiveBackupAlbums>(hiveBackupInfoBox);
    HiveBackupAlbums? backupAlbumInfo = backupAlbumInfoBox.get(
      backupInfoKey,
      defaultValue: HiveBackupAlbums(
        selectedAlbumIds: [],
        excludedAlbumsIds: [],
      ),
    );

    if (backupAlbumInfo == null) {
      debugPrint("[ERROR] getting Hive backup album infomation");
      return;
    }

    // First time backup - set isAll album is the default one for backup.
    if (backupAlbumInfo.selectedAlbumIds.isEmpty) {
      debugPrint("First time backup setup recent album as default");

      AssetPathEntity albumHasAllAssets = availableAlbums.where((album) => album.albumEntity.isAll).first.albumEntity;

      backupAlbumInfoBox.put(
        backupInfoKey,
        HiveBackupAlbums(
          selectedAlbumIds: [albumHasAllAssets.id],
          excludedAlbumsIds: [],
        ),
      );

      backupAlbumInfo = backupAlbumInfoBox.get(backupInfoKey);
    }

    // Generate AssetPathEntity from id to add to local state
    try {
      for (var selectedAlbumId in backupAlbumInfo!.selectedAlbumIds) {
        var albumAsset = await AssetPathEntity.fromId(selectedAlbumId);
        state = state.copyWith(selectedBackupAlbums: {...state.selectedBackupAlbums, albumAsset});
      }

      for (var excludedAlbumId in backupAlbumInfo.excludedAlbumsIds) {
        var albumAsset = await AssetPathEntity.fromId(excludedAlbumId);
        state = state.copyWith(excludedBackupAlbums: {...state.excludedBackupAlbums, albumAsset});
      }
    } catch (e) {
      debugPrint("[ERROR] Failed to generate album from id $e");
    }
  }

  void getBackupInfo() async {
    getAlbumsOnDevice();
    _updateServerInfo();

    List<AssetPathEntity> list = await PhotoManager.getAssetPathList(onlyAll: true, type: RequestType.common);

    List<String> didBackupAsset = await _backupService.getDeviceBackupAsset();

    if (list.isEmpty) {
      debugPrint("No Asset On Device");
      state = state.copyWith(
          backupProgress: BackUpProgressEnum.idle, totalAssetCount: 0, assetOnDatabase: didBackupAsset.length);
      return;
    }

    int totalAsset = list[0].assetCount;

    state = state.copyWith(totalAssetCount: totalAsset, assetOnDatabase: didBackupAsset.length);
  }

  void startBackupProcess() async {
    _updateServerInfo();

    state = state.copyWith(backupProgress: BackUpProgressEnum.inProgress);

    var authResult = await PhotoManager.requestPermissionExtend();
    if (authResult.isAuth) {
      await PhotoManager.clearFileCache();
      // await PhotoManager.presentLimited();
      // Gather assets info
      List<AssetPathEntity> list =
          await PhotoManager.getAssetPathList(hasAll: true, onlyAll: true, type: RequestType.common);

      // Get device assets info from database
      // Compare and find different assets that has not been backing up
      // Backup those assets
      List<String> backupAsset = await _backupService.getDeviceBackupAsset();

      if (list.isEmpty) {
        debugPrint("No Asset On Device - Abort Backup Process");
        state = state.copyWith(
            backupProgress: BackUpProgressEnum.idle, totalAssetCount: 0, assetOnDatabase: backupAsset.length);
        return;
      }

      int totalAsset = list[0].assetCount;
      List<AssetEntity> currentAssets = await list[0].getAssetListRange(start: 0, end: totalAsset);

      state = state.copyWith(totalAssetCount: totalAsset, assetOnDatabase: backupAsset.length);
      // Remove item that has already been backed up
      for (var backupAssetId in backupAsset) {
        currentAssets.removeWhere((e) => e.id == backupAssetId);
      }

      if (currentAssets.isEmpty) {
        state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
      }

      state = state.copyWith(backingUpAssetCount: currentAssets.length);

      // Perform Backup
      state = state.copyWith(cancelToken: CancelToken());
      _backupService.backupAsset(currentAssets, state.cancelToken, _onAssetUploaded, _onUploadProgress);
    } else {
      PhotoManager.openSetting();
    }
  }

  void cancelBackup() {
    state.cancelToken.cancel('Cancel Backup');
    state = state.copyWith(backupProgress: BackUpProgressEnum.idle, progressInPercentage: 0.0);
  }

  void _onAssetUploaded(String deviceAssetId, String deviceId) {
    state =
        state.copyWith(backingUpAssetCount: state.backingUpAssetCount - 1, assetOnDatabase: state.assetOnDatabase + 1);

    if (state.backingUpAssetCount == 0) {
      state = state.copyWith(backupProgress: BackUpProgressEnum.done, progressInPercentage: 0.0);
    }

    _updateServerInfo();
  }

  void _onUploadProgress(int sent, int total) {
    state = state.copyWith(progressInPercentage: (sent.toDouble() / total.toDouble() * 100));
  }

  void _updateServerInfo() async {
    var serverInfo = await _serverInfoService.getServerInfo();

    // Update server info
    state = state.copyWith(
      serverInfo: ServerInfo(
        diskSize: serverInfo.diskSize,
        diskUse: serverInfo.diskUse,
        diskAvailable: serverInfo.diskAvailable,
        diskSizeRaw: serverInfo.diskSizeRaw,
        diskUseRaw: serverInfo.diskUseRaw,
        diskAvailableRaw: serverInfo.diskAvailableRaw,
        diskUsagePercentage: serverInfo.diskUsagePercentage,
      ),
    );
  }

  void resumeBackup() {
    var authState = ref?.read(authenticationProvider);

    // Check if user is login
    var accessKey = Hive.box(userInfoBox).get(accessTokenKey);

    // User has been logged out return
    if (authState != null) {
      if (accessKey == null || !authState.isAuthenticated) {
        debugPrint("[resumeBackup] not authenticated - abort");
        return;
      }

      // Check if this device is enable backup by the user
      if ((authState.deviceInfo.deviceId == authState.deviceId) && authState.deviceInfo.isAutoBackup) {
        // check if backup is alreayd in process - then return
        if (state.backupProgress == BackUpProgressEnum.inProgress) {
          debugPrint("[resumeBackup] Backup is already in progress - abort");
          return;
        }

        // Run backup
        debugPrint("[resumeBackup] Start back up");
        startBackupProcess();
      }

      return;
    }
  }
}

final backupProvider = StateNotifierProvider<BackupNotifier, BackUpState>((ref) {
  return BackupNotifier(ref: ref);
});
