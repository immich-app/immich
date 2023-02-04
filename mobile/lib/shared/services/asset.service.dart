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
import 'package:logging/logging.dart';
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
  final log = Logger('AssetService');

  AssetService(this._apiService, this._backupService, this._backgroundService);

  /// Returns `null` if the server state did not change, else list of assets
  Future<Pair<List<Asset>?, String?>> getRemoteAssets({String? etag}) async {
    try {
      final Pair<List<AssetResponseDto>, String?>? remote =
          await _apiService.assetApi.getAllAssetsWithETag(eTag: etag);
      if (remote == null) {
        return const Pair(null, null);
      }
      return Pair(
        remote.first.map(Asset.remote).toList(growable: false),
        remote.second,
      );
    } catch (e, stack) {
      log.severe('Error while getting remote assets', e, stack);
      return const Pair(null, null);
    }
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
      final String userId = Hive.box(userInfoBox).get(userIdKey);
      if (backupAlbumInfo != null) {
        return (await _backupService
                .buildUploadCandidates(backupAlbumInfo.deepCopy()))
            .map((e) => Asset.local(e, userId))
            .toList(growable: false);
      }
    } catch (e) {
      debugPrint("Error [_getLocalAssets] ${e.toString()}");
    }
    return null;
  }

  Future<Asset?> getAssetById(String assetId) async {
    try {
      final dto = await _apiService.assetApi.getAssetById(assetId);
      if (dto != null) {
        return Asset.remote(dto);
      }
    } catch (e) {
      debugPrint("Error [getAssetById]  ${e.toString()}");
    }
    return null;
  }

  Future<List<DeleteAssetResponseDto>?> deleteAssets(
    Iterable<Asset> deleteAssets,
  ) async {
    try {
      final List<String> payload = [];

      for (final asset in deleteAssets) {
        payload.add(asset.remoteId!);
      }

      return await _apiService.assetApi
          .deleteAsset(DeleteAssetDto(ids: payload));
    } catch (e) {
      debugPrint("Error getAllAsset  ${e.toString()}");
      return null;
    }
  }
}
