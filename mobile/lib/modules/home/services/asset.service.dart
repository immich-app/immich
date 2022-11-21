import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(apiServiceProvider),
    ref.watch(backupServiceProvider),
    ref.watch(backgroundServiceProvider),
  ),
);

class AssetService {
  final ApiService _apiService;
  final BackupService _backupService;
  final BackgroundService _backgroundService;

  AssetService(this._apiService, this._backupService, this._backgroundService);

  /// Returns all local, remote assets in that order
  Future<List<Asset>> getAllAsset({bool urgent = false}) async {
    final List<Asset> assets = [];
    try {
      // not using `await` here to fetch local & remote assets concurrently
      final Future<List<AssetResponseDto>?> remoteTask =
          _apiService.assetApi.getAllAssets();
      final Iterable<AssetEntity> newLocalAssets;
      final List<AssetEntity> localAssets = await _getLocalAssets(urgent);
      final List<AssetResponseDto> remoteAssets = await remoteTask ?? [];
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
      // the order (first all local, then remote assets) is important!
      assets.addAll(remoteAssets.map((e) => Asset.remote(e)));
    } catch (e) {
      debugPrint("Error [getAllAsset]  ${e.toString()}");
    }
    return assets;
  }

  /// if [urgent] is `true`, do not block by waiting on the background service
  /// to finish running. Returns an empty list instead after a timeout.
  Future<List<AssetEntity>> _getLocalAssets(bool urgent) async {
    try {
      final Future<bool> hasAccess = urgent
          ? _backgroundService.hasAccess
              .timeout(const Duration(milliseconds: 250))
          : _backgroundService.hasAccess;
      if (!await hasAccess) {
        throw Exception("Error [getAllAsset] failed to gain access");
      }
      final box = await Hive.openBox<HiveBackupAlbums>(hiveBackupInfoBox);
      final HiveBackupAlbums? backupAlbumInfo = box.get(backupInfoKey);

      return backupAlbumInfo != null
          ? await _backupService
              .buildUploadCandidates(backupAlbumInfo.deepCopy())
          : [];
    } catch (e) {
      debugPrint("Error [_getLocalAssets] ${e.toString()}");
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
    Iterable<AssetResponseDto> deleteAssets,
  ) async {
    try {
      final List<String> payload = [];

      for (final asset in deleteAssets) {
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
