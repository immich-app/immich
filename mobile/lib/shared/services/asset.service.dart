import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
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
  Future<bool> refreshRemoteAssets([User? user]) async {
    user ??= Store.get<User>(StoreKey.currentUser);
    final Stopwatch sw = Stopwatch()..start();
    final bool changes = await _syncService.syncRemoteAssetsToDb(
      user,
      _getRemoteAssetChanges,
      _getRemoteAssets,
    );
    debugPrint("refreshRemoteAssets full took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  /// Returns `(null, null)` if changes are invalid -> requires full sync
  Future<(List<Asset>? toUpsert, List<String>? toDelete)>
      _getRemoteAssetChanges(User user, DateTime since) async {
    final deleted = await _apiService.auditApi
        .getAuditDeletes(since, EntityType.ASSET, userId: user.id);
    if (deleted == null || deleted.needsFullSync) return (null, null);
    final assetDto = await _apiService.assetApi
        .getAllAssets(userId: user.id, updatedAfter: since);
    if (assetDto == null) return (null, null);
    return (assetDto.map(Asset.remote).toList(), deleted.ids);
  }

  /// Returns `null` if the server state did not change, else list of assets
  Future<List<Asset>?> _getRemoteAssets(User user) async {
    const int chunkSize = 5000;
    try {
      final DateTime now = DateTime.now().toUtc();
      final List<Asset> allAssets = [];
      for (int i = 0;; i += chunkSize) {
        final List<AssetResponseDto>? assets =
            await _apiService.assetApi.getAllAssets(
          userId: user.id,
          // updatedBefore is important! without it we could
          // a) get the same Asset multiple times in different versions (when
          // the asset is modified while the chunks are loaded from the server)
          // b) miss assets when new assets are inserted in between the calls
          updatedBefore: now,
          skip: i,
          take: chunkSize,
        );
        if (assets == null) {
          return null;
        }
        allAssets.addAll(assets.map(Asset.remote));
        if (assets.length < chunkSize) {
          break;
        }
      }
      return allAssets;
    } catch (error, stack) {
      log.severe(
        'Error while getting remote assets: ${error.toString()}',
        error,
        stack,
      );
      return null;
    }
  }

  Future<bool> deleteAssets(
    Iterable<Asset> deleteAssets, {
    bool? force = false,
  }) async {
    try {
      final List<String> payload = [];

      for (final asset in deleteAssets) {
        payload.add(asset.remoteId!);
      }

      await _apiService.assetApi.deleteAssets(
        AssetBulkDeleteDto(
          ids: payload,
          force: force,
        ),
      );
      return true;
    } catch (error, stack) {
      log.severe("Error deleteAssets  ${error.toString()}", error, stack);
    }
    return false;
  }

  /// Loads the exif information from the database. If there is none, loads
  /// the exif info from the server (remote assets only)
  Future<Asset> loadExif(Asset a) async {
    a.exifInfo ??= await _db.exifInfos.get(a.id);
    // fileSize is always filled on the server but not set on client
    if (a.exifInfo?.fileSize == null) {
      if (a.isRemote) {
        final dto = await _apiService.assetApi.getAssetInfo(a.remoteId!);
        if (dto != null && dto.exifInfo != null) {
          final newExif = Asset.remote(dto).exifInfo!.copyWith(id: a.id);
          if (newExif != a.exifInfo) {
            if (a.isInDb) {
              _db.writeTxn(() => a.put(_db));
            } else {
              debugPrint("[loadExif] parameter Asset is not from DB!");
            }
          }
        }
      } else {
        // TODO implement local exif info parsing
      }
    }
    return a;
  }

  Future<List<Asset?>> updateAssets(
    List<Asset> assets,
    UpdateAssetDto updateAssetDto,
  ) async {
    final List<AssetResponseDto?> dtos = await Future.wait(
      assets.map(
        (a) => _apiService.assetApi.updateAsset(a.remoteId!, updateAssetDto),
      ),
    );
    bool allInDb = true;
    for (int i = 0; i < assets.length; i++) {
      final dto = dtos[i], old = assets[i];
      if (dto != null) {
        final remote = Asset.remote(dto);
        if (old.canUpdate(remote)) {
          assets[i] = old.updatedCopy(remote);
        }
        allInDb &= assets[i].isInDb;
      }
    }
    final toUpdate = allInDb ? assets : assets.where((e) => e.isInDb).toList();
    await _syncService.upsertAssetsWithExif(toUpdate);
    return assets;
  }

  Future<List<Asset?>> changeFavoriteStatus(
    List<Asset> assets,
    bool isFavorite,
  ) {
    return updateAssets(assets, UpdateAssetDto(isFavorite: isFavorite));
  }

  Future<List<Asset?>> changeArchiveStatus(List<Asset> assets, bool isArchive) {
    return updateAssets(assets, UpdateAssetDto(isArchived: isArchive));
  }

  Future<List<Asset?>> changeDateTime(
    List<Asset> assets,
    String updatedDt,
  ) {
    return updateAssets(
      assets,
      UpdateAssetDto(dateTimeOriginal: updatedDt),
    );
  }

  Future<List<Asset?>> changeLocation(
    List<Asset> assets,
    LatLng location,
  ) {
    return updateAssets(
      assets,
      UpdateAssetDto(
        latitude: location.latitude,
        longitude: location.longitude,
      ),
    );
  }
}
