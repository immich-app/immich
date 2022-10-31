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
    try {
      HiveBackupAlbums? backupAlbumInfo =
          Hive.box<HiveBackupAlbums>(hiveBackupInfoBox).get(backupInfoKey);

      if (backupAlbumInfo != null) {
        final Future<List<AssetEntity>> localTask =
            _backupService.buildUploadCandidates(backupAlbumInfo);
        final Future<List<AssetResponseDto>?> remoteTask =
            _apiService.assetApi.getAllAssets();
        final List<AssetEntity> localAssets = await localTask;
        List<Asset> assets = localAssets.map((e) => Asset.local(e)).toList();
        List<AssetResponseDto>? remoteAssetDto = await remoteTask;
        if (remoteAssetDto != null) {
          assets.addAll(remoteAssetDto.map((e) => Asset.remote(e)));
        }
        return assets;
      } else {
        final remoteAssets = await _apiService.assetApi.getAllAssets();
        return remoteAssets != null
            ? remoteAssets.map((e) => Asset.remote(e)).toList()
            : [];
      }
    } catch (e) {
      debugPrint("Error [getAllAsset]  ${e.toString()}");
      return [];
    }
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
