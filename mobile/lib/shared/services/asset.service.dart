import 'dart:async';
import 'dart:collection';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:immich_mobile/utils/openapi_extensions.dart';
import 'package:immich_mobile/utils/tuple.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
  ),
);

class AssetService {
  final ApiService _apiService;
  final log = Logger('AssetService');
  final Isar _db;
  Completer<bool> _completer = Completer()..complete(false);
  Future<void> _albumRemoteComplete = Future.value();
  Future<void> _albumLocalComplete = Future.value();

  AssetService(
    this._apiService,
    this._db,
  );

  Future<bool> refreshRemoteAssets() async {
    if (!_completer.isCompleted) {
      // guard against concurrent calls
      return _completer.future;
    }
    _completer = Completer();
    // guard against concurrent calls:
    // AlbumService fetches remote assets from shared albums
    await _albumRemoteComplete;
    // AlbumServices reads local assets
    await _albumLocalComplete;
    final Stopwatch sw = Stopwatch()..start();
    bool changes = false;
    try {
      changes = await _refreshRemoteAssets();
    } finally {
      _completer.complete(changes);
    }
    debugPrint("refreshRemoteAssets took ${sw.elapsedMilliseconds}ms");
    return changes;
  }

  Future<bool> get assetRefreshComplete => _completer.future;

  set albumRemoteComplete(Future<void> f) => _albumRemoteComplete = f;
  set albumLocalComplete(Future<void> f) => _albumLocalComplete = f;

  /// Returns `null` if the server state did not change, else list of assets
  Future<List<AssetResponseDto>?> _getRemoteAssets({
    required bool hasCache,
  }) async {
    try {
      final etag = hasCache ? Store.get(StoreKey.assetETag) : null;
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

  Future<bool> _refreshRemoteAssets() async {
    final Stopwatch sw = Stopwatch()..start();
    final int c = await _db.assets.where().remoteIdIsNotNull().count();
    final List<AssetResponseDto>? dtos =
        await _getRemoteAssets(hasCache: c > 0);
    if (dtos == null) {
      debugPrint("fetchRemoteAssets fast took ${sw.elapsedMilliseconds}ms");
      return false;
    }
    final HashSet<String> existingRemoteIds = HashSet.from(
      await _db.assets.where().remoteIdIsNotNull().remoteIdProperty().findAll(),
    );
    final String deviceId = Hive.box(userInfoBox).get(deviceIdKey);
    final HashSet<String> existingLocalIds = HashSet.from(
      await _db.assets
          .filter()
          .isLocalEqualTo(true)
          .localIdProperty()
          .findAll(),
    );
    final HashSet<String> allRemoteIds = HashSet.from(dtos.map((e) => e.id));

    final List<Asset> assets = [];

    for (AssetResponseDto dto in dtos) {
      if (!existingRemoteIds.contains(dto.id)) {
        if (dto.deviceId == deviceId &&
            existingLocalIds.contains(dto.deviceAssetId)) {
          // link to existing asset
          Asset? a = await _db.assets
              .where()
              .localIdDeviceIdEqualTo(dto.deviceAssetId, fastHash(dto.deviceId))
              .findFirst();
          if (a != null) {
            assets.add(a.withUpdatesFromDto(dto));
            continue;
          }
        }
        assets.add(Asset.remote(dto));
      }
    }

    final deletedAssetIds = existingRemoteIds.difference(allRemoteIds);

    if (assets.isEmpty && deletedAssetIds.isEmpty) {
      debugPrint("fetchRemoteAssets medium took ${sw.elapsedMilliseconds}ms");
      return false;
    }
    final exifInfos = assets.map((e) => e.exifInfo).whereNotNull().toList();
    try {
      await _db.writeTxn(() async {
        if (deletedAssetIds.isNotEmpty) {
          await _db.assets.deleteAllByRemoteId(deletedAssetIds);
        }
        if (assets.isNotEmpty) {
          await _db.assets.putAll(assets);
          for (final Asset added in assets) {
            added.exifInfo?.id = added.id;
          }
          await _db.exifInfos.putAll(exifInfos);
        }
      });
    } on IsarError catch (e) {
      debugPrint(e.toString());
    }

    debugPrint("fetchRemoteAssets full took ${sw.elapsedMilliseconds}ms");
    return true;
  }

  Future<void> addMissingRemoteAssetsToDb(
    List<AssetResponseDto> remotes,
  ) async {
    final List<Asset> toAdd = [];
    final List<String> inDb = (await _db.assets
            .where()
            .remoteIdIsNotNull()
            .sortByRemoteId()
            .remoteIdProperty()
            .findAll())
        .cast();
    remotes.sort((a, b) => a.id.compareTo(b.id));
    await diffSortedLists(
      inDb,
      remotes,
      compare: (String a, AssetResponseDto b) => a.compareTo(b.id),
      both: (a, b) => false,
      onlyFirst: (a) {},
      onlySecond: (AssetResponseDto b) => toAdd.add(Asset.remote(b)),
    );
    final exifInfos = toAdd.map((e) => e.exifInfo).whereNotNull().toList();
    try {
      await _db.writeTxn(() async {
        await _db.assets.putAll(toAdd);
        for (final Asset added in toAdd) {
          added.exifInfo?.id = added.id;
        }
        await _db.exifInfos.putAll(exifInfos);
      });
    } on IsarError catch (e) {
      debugPrint(e.toString());
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

  /// Returns a tuple (toLink, toUpsert)
  Future<Pair<List<Asset>, List<Asset>>> linkExistingToLocal(
    List<AssetEntity> assets,
  ) async {
    if (assets.isEmpty) {
      return const Pair([], []);
    }
    final int deviceId = Store.get(StoreKey.deviceIdHash);
    final List<Asset> inDb = await _db.assets
        .where()
        .anyOf(
          assets,
          (q, AssetEntity a) => q.localIdDeviceIdEqualTo(a.id, deviceId),
        )
        .sortByLocalId()
        .findAll();

    assets.sort((a, b) => a.id.compareTo(b.id));

    final List<Asset> existing = [];
    final List<Asset> toUpsert = [];
    await diffSortedLists(
      inDb,
      assets,
      compare: (Asset a, AssetEntity b) => a.localId.compareTo(b.id),
      both: (Asset a, AssetEntity b) {
        if (a.isLocal) {
          existing.add(a);
        } else {
          if (a.updateFromAssetEntity(b)) {
            toUpsert.add(a);
            return true;
          }
        }
        return false;
      },
      onlyFirst: (Asset a) {},
      onlySecond: (AssetEntity a) => toUpsert.add(Asset.local(a)),
    );

    return Pair(existing, toUpsert);
  }

  /// removes local assets from DB only if they are neither remote nor in another album
  Future<void> handleLocalAssetRemoval(
    List<Asset> deleteCandidates,
    List<Asset> existing,
  ) async {
    if (deleteCandidates.isEmpty) {
      return;
    }
    deleteCandidates.sort((a, b) => a.id.compareTo(b.id));
    existing.sort((a, b) => a.id.compareTo(b.id));
    final List<int> idsToDelete = [];
    final List<Asset> toUpdate = [];
    await diffSortedLists(
      existing,
      deleteCandidates,
      compare: (Asset a, Asset b) => a.id.compareTo(b.id),
      both: (Asset a, Asset b) => false,
      onlyFirst: (Asset a) {},
      onlySecond: (Asset b) {
        if (b.isRemote) {
          b.isLocal = false;
          toUpdate.add(b);
        } else {
          idsToDelete.add(b.id);
        }
      },
    );
    if (idsToDelete.isNotEmpty || toUpdate.isNotEmpty) {
      await _db.writeTxn(() async {
        await _db.assets.deleteAll(idsToDelete);
        await _db.assets.putAll(toUpdate);
      });
    }
  }

  /// removes remote shared assets from DB unless they exist in another shared album
  Future<void> handleSharedAssetRemoval(
    List<Asset> deleteCandidates,
    List<Asset> existing,
  ) async {
    if (deleteCandidates.isEmpty) {
      return;
    }
    deleteCandidates.sort((a, b) => a.id.compareTo(b.id));
    existing.sort((a, b) => a.id.compareTo(b.id));
    final List<int> idsToDelete = [];
    await diffSortedLists(
      existing,
      deleteCandidates,
      compare: (Asset a, Asset b) => a.id.compareTo(b.id),
      both: (Asset a, Asset b) => false,
      onlyFirst: (Asset a) {},
      onlySecond: (Asset b) => idsToDelete.add(b.id),
    );
    if (idsToDelete.isNotEmpty) {
      return _db.writeTxn(() => _db.assets.deleteAll(idsToDelete));
    }
  }

  Future<Asset?> updateAsset(
    Asset asset,
    UpdateAssetDto updateAssetDto,
  ) async {
    final dto =
        await _apiService.assetApi.updateAsset(asset.remoteId!, updateAssetDto);
    return dto == null ? null : Asset.remote(dto);
  }

  Future<Asset?> changeFavoriteStatus(Asset asset, bool isFavorite) {
    return updateAsset(asset, UpdateAssetDto(isFavorite: isFavorite));
  }
}
