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
        .getAuditDeletes(EntityType.ASSET, since, userId: user.id);
    if (deleted == null || deleted.needsFullSync) return (null, null);
    final assetDto = await _apiService.assetApi
        .getAllAssets(userId: user.id, updatedAfter: since);
    if (assetDto == null) return (null, null);
    return (assetDto.map(Asset.remote).toList(), deleted.ids);
  }

  /// Returns `null` if the server state did not change, else list of assets
  Future<List<Asset>?> _getRemoteAssets(User user) async {
    try {
      final List<AssetResponseDto>? assets =
          await _apiService.assetApi.getAllAssets(userId: user.id);
      if (assets == null) {
        return null;
      } else if (assets.isNotEmpty && assets.first.ownerId != user.id) {
        log.warning("Make sure that server and app versions match!"
            " The server returned assets for user ${assets.first.ownerId}"
            " while requesting assets of user ${user.id}");
        return null;
      }
      return assets.map(Asset.remote).toList();
    } catch (error, stack) {
      log.severe(
        'Error while getting remote assets: ${error.toString()}',
        error,
        stack,
      );
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
    } catch (error, stack) {
      log.severe("Error deleteAssets  ${error.toString()}", error, stack);
      return null;
    }
  }

  /// Loads the exif information from the database. If there is none, loads
  /// the exif info from the server (remote assets only)
  Future<Asset> loadExif(Asset a) async {
    a.exifInfo ??= await _db.exifInfos.get(a.id);
    // fileSize is always filled on the server but not set on client
    if (a.exifInfo?.fileSize == null) {
      if (a.isRemote) {
        final dto = await _apiService.assetApi.getAssetById(a.remoteId!);
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
}
