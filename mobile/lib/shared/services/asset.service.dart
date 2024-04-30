// ignore_for_file: null_argument_to_non_null_type

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
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

  /// Returns the list of people of the given asset id.
  // If the server is not reachable `null` is returned.
  Future<List<PersonWithFacesResponseDto>?> getRemotePeopleOfAsset(
    String remoteId,
  ) async {
    try {
      final AssetResponseDto? dto =
          await _apiService.assetApi.getAssetInfo(remoteId);

      return dto?.people;
    } catch (error, stack) {
      log.severe(
        'Error while getting remote asset info: ${error.toString()}',
        error,
        stack,
      );

      return null;
    }
  }

  /// Returns `null` if the server state did not change, else list of assets
  Future<List<Asset>?> _getRemoteAssets(User user) async {
    const int chunkSize = 10000;
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
        'Error while getting remote assets',
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
      log.severe("Error while deleting assets", error, stack);
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

  Future<void> updateAssets(
    List<Asset> assets,
    UpdateAssetDto updateAssetDto,
  ) async {
    return await _apiService.assetApi.updateAssets(
      AssetBulkUpdateDto(
        ids: assets.map((e) => e.remoteId!).toList(),
        dateTimeOriginal: updateAssetDto.dateTimeOriginal,
        isFavorite: updateAssetDto.isFavorite,
        isArchived: updateAssetDto.isArchived,
        latitude: updateAssetDto.latitude,
        longitude: updateAssetDto.longitude,
      ),
    );
  }

  Future<List<Asset?>> changeFavoriteStatus(
    List<Asset> assets,
    bool isFavorite,
  ) async {
    try {
      await updateAssets(assets, UpdateAssetDto(isFavorite: isFavorite));

      for (var element in assets) {
        element.isFavorite = isFavorite;
      }

      await _syncService.upsertAssetsWithExif(assets);

      return assets;
    } catch (error, stack) {
      log.severe("Error while changing favorite status", error, stack);
      return Future.value(null);
    }
  }

  Future<List<Asset?>> changeArchiveStatus(
    List<Asset> assets,
    bool isArchived,
  ) async {
    try {
      await updateAssets(assets, UpdateAssetDto(isArchived: isArchived));

      for (var element in assets) {
        element.isArchived = isArchived;
      }

      await _syncService.upsertAssetsWithExif(assets);

      return assets;
    } catch (error, stack) {
      log.severe("Error while changing archive status", error, stack);
      return Future.value(null);
    }
  }

  Future<List<Asset?>> changeDateTime(
    List<Asset> assets,
    String updatedDt,
  ) async {
    try {
      await updateAssets(
        assets,
        UpdateAssetDto(dateTimeOriginal: updatedDt),
      );

      for (var element in assets) {
        element.fileCreatedAt = DateTime.parse(updatedDt);
        element.exifInfo?.dateTimeOriginal = DateTime.parse(updatedDt);
      }

      await _syncService.upsertAssetsWithExif(assets);

      return assets;
    } catch (error, stack) {
      log.severe("Error while changing date/time status", error, stack);
      return Future.value(null);
    }
  }

  Future<List<Asset?>> changeLocation(
    List<Asset> assets,
    LatLng location,
  ) async {
    try {
      await updateAssets(
        assets,
        UpdateAssetDto(
          latitude: location.latitude,
          longitude: location.longitude,
        ),
      );

      for (var element in assets) {
        element.exifInfo?.lat = location.latitude;
        element.exifInfo?.long = location.longitude;
      }

      await _syncService.upsertAssetsWithExif(assets);

      return assets;
    } catch (error, stack) {
      log.severe("Error while changing location status", error, stack);
      return Future.value(null);
    }
  }
}
