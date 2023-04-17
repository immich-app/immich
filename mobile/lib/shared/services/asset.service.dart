import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:immich_mobile/utils/openapi_extensions.dart';
import 'package:immich_mobile/utils/tuple.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(apiServiceProvider),
    ref.watch(syncServiceProvider),
    ref.watch(dbProvider),
  ),
);

class AssetService {
  final ApiService _apiService;
  final SyncService _syncService;
  final log = Logger('AssetService');
  final Isar _db;

  AssetService(
    this._apiService,
    this._syncService,
    this._db,
  );

  /// Checks the server for updated assets and updates the local database if
  /// required. Returns `true` if there were any changes.
  Future<bool> refreshRemoteAssets() async {
    final Stopwatch sw = Stopwatch()..start();
    final int numOwnedRemoteAssets = await _db.assets
        .where()
        .remoteIdIsNotNull()
        .filter()
        .ownerIdEqualTo(Store.get(StoreKey.currentUser).isarId)
        .count();
    final bool changes = await _syncService.syncRemoteAssetsToDb(
      () async => (await _getRemoteAssets(hasCache: numOwnedRemoteAssets > 0))
          ?.map(Asset.remote)
          .toList(),
    );
    debugPrint("refreshRemoteAssets full took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  /// Returns `null` if the server state did not change, else list of assets
  Future<List<AssetResponseDto>?> _getRemoteAssets({
    required bool hasCache,
  }) async {
    try {
      final etag = hasCache ? Store.tryGet(StoreKey.assetETag) : null;
      final Pair<List<AssetResponseDto>, String?>? remote =
          await _apiService.assetApi.getAllAssetsWithETag(eTag: etag);
      if (remote == null) {
        return null;
      }
      if (remote.second != null && remote.second != etag) {
        Store.put(StoreKey.assetETag, remote.second);
      }
      return remote.first;
    } catch (e, stack) {
      log.severe('Error while getting remote assets', e, stack);
      return null;
    }
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

  /// Loads the exif information from the database. If there is none, loads
  /// the exif info from the server (remote assets only)
  Future<Asset> loadExif(Asset a) async {
    a.exifInfo ??= await _db.exifInfos.get(a.id);
    if (a.exifInfo?.iso == null) {
      if (a.isRemote) {
        final dto = await _apiService.assetApi.getAssetById(a.remoteId!);
        if (dto != null && dto.exifInfo != null) {
          a = a.withUpdatesFromDto(dto);
          if (a.isInDb) {
            _db.writeTxn(() => a.put(_db));
          } else {
            debugPrint("[loadExif] parameter Asset is not from DB!");
          }
        }
      } else {
        // TODO implement local exif info parsing
      }
    }
    return a;
  }

  Future<Asset?> updateAsset(
    Asset asset,
    UpdateAssetDto updateAssetDto,
  ) async {
    final dto =
        await _apiService.assetApi.updateAsset(asset.remoteId!, updateAssetDto);
    if (dto != null) {
      final updated = Asset.remote(dto).updateFromDb(asset);
      if (updated.isInDb) {
        await _db.writeTxn(() => updated.put(_db));
      }
      return updated;
    }
    return null;
  }

  Future<Asset?> changeFavoriteStatus(Asset asset, bool isFavorite) {
    return updateAsset(asset, UpdateAssetDto(isFavorite: isFavorite));
  }

  Future<Asset?> changeArchiveStatus(Asset asset, bool isArchive) {
    return updateAsset(asset, UpdateAssetDto(isArchived: isArchive));
  }
}
