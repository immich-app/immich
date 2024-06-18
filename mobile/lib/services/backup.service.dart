import 'dart:isolate';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:background_downloader/background_downloader.dart';

final backupServiceProvider = Provider(
  (ref) => BackupService(ref.watch(apiServiceProvider)),
);

/// Service to handle backup and restore of data
/// - [ ] Find the assets that needed to be backed up
/// - [ ] Contruct asset's album information
/// - [ ] Check hash before upload
/// - [ ] Upload to server
/// - [ ] Handle LivePhotos
/// - [ ] Handle iCloud assets
///
/// Questions:
/// - What happen when the upload is interrupted?
///
/// - What happen when the app is killed?
///
/// - How to run the task in background mode?
class BackupService {
  final _fileDownloader = FileDownloader();
  final ApiService _apiService;

  BackupService(this._apiService);

  buildBackupCandidates() async {
    // Get assets on devices
    final albums = await PhotoManager.getAssetPathList(hasAll: true);
    List<AssetEntity> assetsOnDevice = await _getAssetsOnDevice(albums);

    // Get assets on server
    final String deviceId = Store.get(StoreKey.deviceId);
    final assetsOnServer =
        await _apiService.assetsApi.getAllUserAssetsByDeviceId(deviceId);

    // Get assets not on server
    if (assetsOnServer != null && assetsOnServer.isNotEmpty) {
      assetsOnDevice.removeWhere(
        (asset) => !assetsOnServer.contains(asset.id),
      );
    }

    // Build UploadTask
    final uploadTasks = await _constructUploadTask(assetsOnDevice);
    print(uploadTasks);
  }

  Future<List<UploadTask>> _constructUploadTask(
    List<AssetEntity> assets,
  ) async {
    final List<UploadTask> tasks = [];

    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);
    final String deviceId = Store.get(StoreKey.deviceId);
    final url = '$savedEndpoint/asset/upload';
    final headers = {
      'x-immich-user-token': Store.get(StoreKey.accessToken),
      'Transfer-Encoding': 'chunked',
    };

    for (final entity in assets) {
      final file = await entity.originFile;
      final fileName = await entity.titleAsync;
      final (baseDirectory, directory, _) = await Task.split(file: file);

      final fields = {
        'deviceAssetId': entity.id,
        'deviceId': deviceId,
        'fileCreatedAt': entity.createDateTime.toUtc().toIso8601String(),
        'fileModifiedAt': entity.modifiedDateTime.toUtc().toIso8601String(),
        'isFavorite': entity.isFavorite.toString(),
        'duration': entity.videoDuration.toString(),
      };

      final task = UploadTask(
        url: url,
        baseDirectory: baseDirectory,
        directory: directory,
        filename: fileName,
        group: 'backup',
        fileField: 'assetData',
        taskId: entity.id,
        fields: fields,
        headers: headers,
        updates: Updates.statusAndProgress,
        retries: 0,
        httpRequestMethod: 'POST',
        displayName: 'Immich',
      );

      tasks.add(task);
    }

    return tasks;
  }

  Future<List<AssetEntity>> _getAssetsOnDevice(
    List<AssetPathEntity> albums,
  ) async {
    List<AssetEntity> result = [];

    for (final album in albums) {
      final assetCount = await album.assetCountAsync;

      if (assetCount == 0) {
        continue;
      }

      final assets = await album.getAssetListRange(
        start: 0,
        end: assetCount,
      );

      result.addAll(assets);
    }

    return result;
  }
}
