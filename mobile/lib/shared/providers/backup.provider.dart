import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';
import 'package:immich_mobile/shared/models/backup_state.model.dart';
import 'package:immich_mobile/shared/models/server_info.model.dart';
import 'package:immich_mobile/shared/services/backup.service.dart';
import 'package:photo_manager/photo_manager.dart';

class BackupNotifier extends StateNotifier<BackUpState> {
  BackupNotifier()
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

  final BackupService _backupService = BackupService();
  final ServerInfoService _serverInfoService = ServerInfoService();

  void getBackupInfo() async {
    _updateServerInfo();

    List<AssetPathEntity> list = await PhotoManager.getAssetPathList(onlyAll: true, type: RequestType.image);

    if (list.isEmpty) {
      debugPrint("No Asset On Device");
      return;
    }

    int totalAsset = list[0].assetCount;
    List<String> didBackupAsset = await _backupService.getDeviceBackupAsset();

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
          await PhotoManager.getAssetPathList(hasAll: true, onlyAll: true, type: RequestType.image);

      if (list.isEmpty) {
        debugPrint("No Asset On Device - Abort Backup Process");
        return;
      }

      int totalAsset = list[0].assetCount;
      List<AssetEntity> currentAssets = await list[0].getAssetListRange(start: 0, end: totalAsset);

      // Get device assets info from database
      // Compare and find different assets that has not been backing up
      // Backup those assets
      List<String> backupAsset = await _backupService.getDeviceBackupAsset();

      state = state.copyWith(totalAssetCount: totalAsset, assetOnDatabase: backupAsset.length);
      // Remove item that has already been backed up
      for (var backupAssetId in backupAsset) {
        currentAssets.removeWhere((e) => e.id == backupAssetId);
      }

      if (currentAssets.isEmpty) {
        state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
      }

      state = state.copyWith(backingUpAssetCount: currentAssets.length);

      // Perform Packup
      state = state.copyWith(cancelToken: CancelToken());
      _backupService.backupAsset(currentAssets, state.cancelToken, _onAssetUploaded, _onUploadProgress);
    } else {
      PhotoManager.openSetting();
    }
  }

  void cancelBackup() {
    state.cancelToken.cancel('Cancel Backup');
    state = state.copyWith(backupProgress: BackUpProgressEnum.idle);
  }

  void _onAssetUploaded() {
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
}

final backupProvider = StateNotifierProvider<BackupNotifier, BackUpState>((ref) {
  return BackupNotifier();
});
