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
          ),
        );

  Ref? ref;
  final BackupService _backupService = BackupService();
  final ServerInfoService _serverInfoService = ServerInfoService();
  final StreamController _onAssetBackupStreamCtrl =
      StreamController.broadcast();

  void getBackupInfo() async {
    _updateServerInfo();

    List<AssetPathEntity> list = await PhotoManager.getAssetPathList(
        onlyAll: true, type: RequestType.common);
    List<String> didBackupAsset = await _backupService.getDeviceBackupAsset();

    if (list.isEmpty) {
      debugPrint("No Asset On Device");
      state = state.copyWith(
          backupProgress: BackUpProgressEnum.idle,
          totalAssetCount: 0,
          assetOnDatabase: didBackupAsset.length);
      return;
    }

    int totalAsset = list[0].assetCount;

    state = state.copyWith(
        totalAssetCount: totalAsset, assetOnDatabase: didBackupAsset.length);
  }

  void startBackupProcess() async {
    _updateServerInfo();

    state = state.copyWith(backupProgress: BackUpProgressEnum.inProgress);

    var authResult = await PhotoManager.requestPermissionExtend();
    if (authResult.isAuth) {
      await PhotoManager.clearFileCache();
      // await PhotoManager.presentLimited();
      // Gather assets info
      List<AssetPathEntity> list = await PhotoManager.getAssetPathList(
          hasAll: true, onlyAll: true, type: RequestType.common);

      // Get device assets info from database
      // Compare and find different assets that has not been backing up
      // Backup those assets
      List<String> backupAsset = await _backupService.getDeviceBackupAsset();

      if (list.isEmpty) {
        debugPrint("No Asset On Device - Abort Backup Process");
        state = state.copyWith(
            backupProgress: BackUpProgressEnum.idle,
            totalAssetCount: 0,
            assetOnDatabase: backupAsset.length);
        return;
      }

      int totalAsset = list[0].assetCount;
      List<AssetEntity> currentAssets =
          await list[0].getAssetListRange(start: 0, end: totalAsset);

      state = state.copyWith(
          totalAssetCount: totalAsset, assetOnDatabase: backupAsset.length);
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
        backingUpAssetCount: state.backingUpAssetCount - 1,
        assetOnDatabase: state.assetOnDatabase + 1);

    if (state.backingUpAssetCount == 0) {
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
