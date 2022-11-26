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
import 'package:immich_mobile/utils/openapi_extensions.dart';
import 'package:immich_mobile/utils/tuple.dart';
import 'package:openapi/api.dart';

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

  /// Returns `null` if the server state did not change, else list of assets
  Future<List<Asset>?> getRemoteAssets() async {
    final Box box = Hive.box(userInfoBox);
    final Pair<List<AssetResponseDto>, String?>? remote = await _apiService
        .assetApi
        .getAllAssetsWithETag(eTag: box.get(assetEtagKey));
    if (remote == null) {
      return null;
    }
    box.put(assetEtagKey, remote.second);
    return remote.first.map(Asset.remote).toList(growable: false);
  }

  /// if [urgent] is `true`, do not block by waiting on the background service
  /// to finish running. Returns `null` instead after a timeout.
  Future<List<Asset>?> getLocalAssets({bool urgent = false}) async {
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
      if (backupAlbumInfo != null) {
        return (await _backupService
                .buildUploadCandidates(backupAlbumInfo.deepCopy()))
            .map(Asset.local)
            .toList(growable: false);
      }
    } catch (e) {
      debugPrint("Error [_getLocalAssets] ${e.toString()}");
    }
    return null;
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
