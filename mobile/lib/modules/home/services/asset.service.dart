import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/src/types/entity.dart';

import '../../backup/models/hive_backup_albums.model.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(apiServiceProvider),
    ref.watch(backupServiceProvider),
  ),
);

class AssetService {
  final ApiService _apiService;
  final BackupService _backupService;

  AssetService(this._apiService, this._backupService);

  Future<List<Asset>> getAllAsset() async {
    final List<Asset> assets = [];
    try {
      final Future<List<AssetResponseDto>?> remoteTask =
          _apiService.assetApi.getAllAssets();

      /* FIXME this is bad:
         The background service might also have the box open at the same time.
         But waiting for it to finish is difficult to do */
      final Box<HiveBackupAlbums> box =
          await Hive.openBox<HiveBackupAlbums>(hiveBackupInfoBox);
      final HiveBackupAlbums? backupAlbumInfo = box.get(backupInfoKey);

      final List<AssetEntity> localAssets = backupAlbumInfo != null
          ? await _backupService
              .buildUploadCandidates(backupAlbumInfo.deepCopy())
          : [];
      final Iterable<AssetEntity> newLocalAssets;

      final List<AssetResponseDto> remoteAssets = await remoteTask ?? [];
      assets.addAll(remoteAssets.map((e) => Asset.remote(e)));
      if (remoteAssets.isNotEmpty && localAssets.isNotEmpty) {
        final String deviceId = Hive.box(userInfoBox).get(deviceIdKey);
        final Set<String> existingIds = remoteAssets
            .where((e) => e.deviceId == deviceId)
            .map((e) => e.deviceAssetId)
            .toSet();
        newLocalAssets = localAssets.where((e) => !existingIds.contains(e.id));
      } else {
        newLocalAssets = localAssets;
      }

      assets.addAll(newLocalAssets.map((e) => Asset.local(e)));
    } catch (e) {
      debugPrint("Error [getAllAsset]  ${e.toString()}");
    }
    return assets;
  }

  Future<Asset?> getAssetById(String assetId) async {
    try {
      return Asset.remote(await _apiService.assetApi.getAssetById(assetId));
    } catch (e) {
      debugPrint("Error [getAssetById]  ${e.toString()}");
      return null;
    }
  }

  Future<List<DeleteAssetResponseDto>?> deleteAssets(
    Set<AssetResponseDto> deleteAssets,
  ) async {
    try {
      List<String> payload = [];

      for (var asset in deleteAssets) {
        payload.add(asset.id);
      }

      return await _apiService.assetApi
          .deleteAsset(DeleteAssetDto(ids: payload));
    } catch (e) {
      debugPrint("Error getAllAsset  ${e.toString()}");
      return null;
    }
  }
}
