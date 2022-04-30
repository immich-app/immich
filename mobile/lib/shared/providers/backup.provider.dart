import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:immich_mobile/shared/models/backup_state.model.dart';
import 'package:immich_mobile/shared/models/server_info.model.dart';
import 'package:immich_mobile/shared/services/backup.service.dart';
import 'package:photo_manager/photo_manager.dart';

import '../models/hive_saved_backup_info.model.dart';

class BackupNotifier extends StateNotifier<BackUpState> {
  BackupNotifier({this.ref})
      : super(
          BackUpState(
            backupProgress: BackUpProgressEnum.idle,
            assetOnDatabase: 0,
            totalAssetCount: 0,
            remainderAssetCount: 0,
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
          ),
        );

  Ref? ref;
  final BackupService _backupService = BackupService();
  final ServerInfoService _serverInfoService = ServerInfoService();
  final StreamController _onAssetBackupStreamCtrl =
      StreamController.broadcast();

  Future<AssetPathEntity?> _getBackupAlbum() async {


    var backupAlbumBox = Hive.box<HiveSavedBackupInfo>(hiveBackupInfoBox).get(savedBackupInfoKey);
    if (backupAlbumBox == null) {
      debugPrint("No album to backup saved");
      return null;
    }

    List<AssetPathEntity> albums = await PhotoManager.getAssetPathList(
        hasAll: true, type: RequestType.common);

    if (albums.isEmpty) {
      debugPrint("No Asset On Device");
      return null;
    }

    String backupAlbumId = backupAlbumBox.assetEntityId;

    try {
      return albums.firstWhere((element) => element.id == backupAlbumId);
    } on StateError catch (_) {
      debugPrint("Saved album could not be found");
      return null;
    }
  }

  void getBackupInfo() async {
    _updateServerInfo();

    List<String> didBackupAsset = await _backupService.getDeviceBackupAsset();

    var backupAlbum = await _getBackupAlbum();
    if (backupAlbum == null) {
      state = state.copyWith(
          backupProgress: BackUpProgressEnum.idle,
          totalAssetCount: 0,
          remainderAssetCount: 0,
          assetOnDatabase: didBackupAsset.length);
      return;
    }

    // Find the number of remaining assets
    int totalAsset = backupAlbum.assetCount;
    List<AssetEntity> currentAssets =
        await backupAlbum.getAssetListRange(start: 0, end: totalAsset);
    currentAssets.removeWhere((e) => didBackupAsset.contains(e.id));

    state = state.copyWith(
        totalAssetCount: backupAlbum.assetCount,
        remainderAssetCount: currentAssets.length,
        assetOnDatabase: didBackupAsset.length);
  }

  void updateBackupState() async {
    List<String> didBackupAsset = await _backupService.getDeviceBackupAsset();

    // Gather assets info
    var backupAlbum = await _getBackupAlbum();
    if (backupAlbum == null) {
      state = state.copyWith(
          backupProgress: BackUpProgressEnum.idle,
          totalAssetCount: 0,
          remainderAssetCount: 0,
          assetOnDatabase: didBackupAsset.length);
      return;
    }

    // Find the number of remaining assets
    int totalAsset = backupAlbum.assetCount;
    List<AssetEntity> currentAssets =
    await backupAlbum.getAssetListRange(start: 0, end: totalAsset);
    currentAssets.removeWhere((e) => didBackupAsset.contains(e.id));

    state = state.copyWith(
        totalAssetCount: backupAlbum.assetCount,
        remainderAssetCount: currentAssets.length,
        assetOnDatabase: didBackupAsset.length
    );

  }

  void startBackupProcess() async {
    _updateServerInfo();

    var authResult = await PhotoManager.requestPermissionExtend();
    if (authResult.isAuth) {
      await PhotoManager.clearFileCache();

      List<String> didBackupAsset = await _backupService.getDeviceBackupAsset();

      // Gather assets info
      var backupAlbum = await _getBackupAlbum();
      if (backupAlbum == null) {
        state = state.copyWith(
            backupProgress: BackUpProgressEnum.idle,
            totalAssetCount: 0,
            remainderAssetCount: 0,
            assetOnDatabase: didBackupAsset.length);
        return;
      }

      // Get device assets info from database
      // Compare and find different assets that has not been backing up
      // Backup those assets
      int totalAsset = backupAlbum.assetCount;
      List<AssetEntity> currentAssets =
          await backupAlbum.getAssetListRange(start: 0, end: totalAsset);


      // Remove item that has already been backed up
      currentAssets.removeWhere((e) => didBackupAsset.contains(e.id));

      if (currentAssets.isEmpty) {
        state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
      }

      state = state.copyWith(
          backupProgress: BackUpProgressEnum.inProgress,
          totalAssetCount: totalAsset,
          remainderAssetCount: currentAssets.length,
          assetOnDatabase: didBackupAsset.length
      );

      // Perform Backup
      state = state.copyWith(cancelToken: CancelToken());
      _backupService.backupAsset(currentAssets, state.cancelToken,
          _onAssetUploaded, _onUploadProgress);
    } else {
      PhotoManager.openSetting();
    }
  }

  void cancelBackup() {
    state.cancelToken.cancel('Cancel Backup');
    state = state.copyWith(
        backupProgress: BackUpProgressEnum.idle, progressInPercentage: 0.0);
  }

  void _onAssetUploaded(String deviceAssetId, String deviceId) {
    state = state.copyWith(
        remainderAssetCount: state.remainderAssetCount - 1,
        assetOnDatabase: state.assetOnDatabase + 1);

    if (state.remainderAssetCount == 0) {
      state = state.copyWith(
          backupProgress: BackUpProgressEnum.done, progressInPercentage: 0.0);
    }

    _updateServerInfo();
  }

  void _onUploadProgress(int sent, int total) {
    state = state.copyWith(
        progressInPercentage: (sent.toDouble() / total.toDouble() * 100));
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
      if ((authState.deviceInfo.deviceId == authState.deviceId) &&
          authState.deviceInfo.isAutoBackup) {
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

final backupProvider =
    StateNotifierProvider<BackupNotifier, BackUpState>((ref) {
  return BackupNotifier(ref: ref);
});
