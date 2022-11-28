import 'dart:async';
import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/models/value.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:immich_mobile/utils/openapi_extensions.dart';
import 'package:immich_mobile/utils/tuple.dart';
import 'package:logging/logging.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';

final assetServiceProvider = Provider(
  (ref) => AssetService(
    ref.watch(apiServiceProvider),
    ref.watch(backupServiceProvider),
    ref.watch(backgroundServiceProvider),
    ref.watch(dbProvider),
  ),
);

class AssetService {
  final ApiService _apiService;
  final BackupService _backupService;
  final BackgroundService _backgroundService;
  final log = Logger('AssetService');
  final Isar _db;

  AssetService(
    this._apiService,
    this._backupService,
    this._backgroundService,
    this._db,
  );

  /// Returns `null` if the server state did not change, else list of assets
  Future<List<AssetResponseDto>?> _getRemoteAssets({
    required bool hasCache,
  }) async {
    try {
      final etag =
          hasCache ? await _db.values.getStr(DbKey.remoteAssetsEtag) : null;
      final Pair<List<AssetResponseDto>, String?>? remote =
          await _apiService.assetApi.getAllAssetsWithETag(eTag: etag);
      if (remote == null) {
        return null;
      }
      if (remote.second != null) {
        await _db.writeTxn(
          () => _db.values.setStr(DbKey.remoteAssetsEtag, remote.second!),
        );
      }
      return remote.first;
    } catch (e, stack) {
      log.severe('Error while getting remote assets', e, stack);
      return null;
    }
  }

  Future<bool> fetchRemoteAssets() async {
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
    final HashSet<LocalId> existingLocalIds = HashSet.from(
      await _db.assets.where().localIdIsNotNull().localIdProperty().findAll(),
    );
    final HashSet<String> allRemoteIds = HashSet.from(dtos.map((e) => e.id));

    final List<Asset> assets = [];

    for (AssetResponseDto dto in dtos) {
      if (!existingRemoteIds.contains(dto.id)) {
        if (dto.deviceId == deviceId &&
            existingLocalIds.contains(dto.localId)) {
          // link to existing asset
          Asset? a =
              await _db.assets.where().localIdEqualTo(dto.localId).findFirst();
          if (a != null) {
            a.remoteId = dto.id;
            if (dto.exifInfo != null) {
              a.exifInfo = ExifInfo.fromDto(dto.exifInfo!);
            }
            assets.add(a);
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
    await _db.writeTxn(() async {
      if (deletedAssetIds.isNotEmpty) {
        await _db.assets.deleteAllByRemoteId(deletedAssetIds);
      }
      if (assets.isNotEmpty) {
        await _db.assets.putAll(assets);
      }
    });
    debugPrint("fetchRemoteAssets full took ${sw.elapsedMilliseconds}ms");
    return true;
  }

  /// if [urgent] is `true`, do not block by waiting on the background service
  /// to finish running. Returns `null` instead after a timeout.
  Future<List<AssetEntity>?> _getLocalAssets({bool urgent = false}) async {
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
            .buildUploadCandidates(backupAlbumInfo.deepCopy()));
      }
    } catch (e) {
      debugPrint("Error [_getLocalAssets] ${e.toString()}");
    }
    return null;
  }

  @Deprecated("functionality is now in AlbumService")
  Future<bool> fetchLocalAssets() async {
    final Stopwatch sw = Stopwatch()..start();
    final List<AssetEntity>? entities = await _getLocalAssets(urgent: false);
    if (entities == null) {
      debugPrint("fetchLocalAssets fast took ${sw.elapsedMilliseconds}ms");
      return false;
    }
    final HashSet<String> existingLocalIds = HashSet.from(
      await _db.assets.where().localIdIsNotNull().localIdProperty().findAll(),
    );
    final Id loggedInUserId = await _db.values.getInt(DbKey.loggedInUser);
    final User? loggedInUser = await _db.users.get(loggedInUserId);

    final List<Asset> assets = entities
        .where((e) => !existingLocalIds.contains(e.id))
        .map((e) => Asset.local(e, loggedInUser!.id))
        .toList(growable: false);

    if (assets.isEmpty) {
      debugPrint("fetchLocalAssets medium ${sw.elapsedMilliseconds}ms");
      return false;
    }

    await _db.writeTxn(() => _db.assets.putAll(assets));
    final result = await _db.assets.where().findAll();
    assert(result.length >= assets.length);
    debugPrint("fetchLocalAssets full took ${sw.elapsedMilliseconds}ms");
    return true;
  }

  Future<Asset?> _getAssetById(String assetId) async {
    try {
      return Asset.remote(await _apiService.assetApi.getAssetById(assetId));
    } catch (e) {
      debugPrint("Error [getAssetById]  ${e.toString()}");
      return null;
    }
  }

  Future<void> addMissingRemoteAssetsToDb(
      List<AssetResponseDto> remotes) async {
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
      both: (a, b) => Future.value(false),
      onlyFirst: (a) {},
      onlySecond: (AssetResponseDto b) => toAdd.add(Asset.remote(b)),
    );
    return _db.writeTxn(() => _db.assets.putAll(toAdd));
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
    if (a.exifInfo == null || a.width == null || a.height == null) {
      if (a.isRemote) {
        final Asset? remote = await _getAssetById(a.remoteId!);
        if (remote != null) {
          remote.id = a.id;
          remote.localId = a.localId;
          if (remote.isInDb) {
            await _db.writeTxn(() => _db.assets.put(remote));
          } else {
            debugPrint("[loadExif] parameter Asset is not from DB!");
          }
          return remote;
        }
      } else {
        // TODO implement local exif info parsing
      }
    }
    return a;
  }

  @deprecated
  Future<List<Asset>> linkExistingToLocalOld(List<Asset> assets) async {
    if (assets.isEmpty) {
      return [];
    }
    final String deviceId = assets.first.deviceId;
    final List<Asset> unlinked = await _db.assets
        .where()
        .anyOf(
          assets,
          (q, Asset a) =>
              q.deviceAssetIdDeviceIdEqualTo(a.deviceAssetId, deviceId),
        )
        .filter()
        .localIdIsNull()
        .sortByDeviceAssetId()
        .findAll();
    final List<Asset> existing =
        await _db.assets.getAllByLocalId(assets.map((e) => e.localId!));

    if (unlinked.isNotEmpty) {
      // replace all assets that are already in DB (e.g. first loaded from remote) and link them
      final HashSet<String> toLinkHash =
          HashSet.from(unlinked.map((e) => e.deviceAssetId));
      assets.removeWhere((e) => toLinkHash.contains(e.deviceAssetId));
      for (Asset a in unlinked) {
        a.localId = a.deviceAssetId.asLocalId;
        assets.add(a);
      }
    }
    if (existing.isNotEmpty) {
      // replace all assets that are already correct in DB
      final HashSet<int> hashedIds =
          HashSet.from(existing.map((e) => e.localId!));
      assets.removeWhere((e) => hashedIds.contains(e.localId));
      return existing;
    }
    return [];
  }

  Future<List<Asset>> linkExistingToLocal(List<Asset> assets) async {
    if (assets.isEmpty) {
      return [];
    }
    final String deviceId = assets.first.deviceId;
    final List<Asset> inDb = await _db.assets
        .where()
        .anyOf(
          assets,
          (q, Asset a) => q
              .deviceAssetIdDeviceIdEqualTo(a.deviceAssetId, deviceId)
              .or()
              .localIdEqualTo(a.localId),
        )
        .sortByDeviceAssetId()
        .findAll();

    assets.sort((a, b) => a.deviceAssetId.compareTo(b.deviceAssetId));

    final List<Asset> existing = [];
    final List<Asset> toUpsert = [];
    await diffSortedLists(
      inDb,
      assets,
      compare: (Asset a, Asset b) => a.deviceAssetId.compareTo(b.deviceAssetId),
      both: (Asset a, Asset b) {
        if (a.isLocal) {
          existing.add(a);
        } else {
          a.localId = b.localId;
          a.width = b.width;
          a.height = b.height;
          toUpsert.add(a);
        }
        return Future.value(false);
      },
      onlyFirst: (Asset a) {
        assert(false);
      },
      onlySecond: (Asset a) => toUpsert.add(a),
    );

    assets.clear();
    assets.addAll(toUpsert);

    return existing;
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
      both: (Asset a, Asset b) => Future.value(false),
      onlyFirst: (Asset a) {},
      onlySecond: (Asset b) {
        if (b.isRemote) {
          b.localId = null;
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
      both: (Asset a, Asset b) => Future.value(false),
      onlyFirst: (Asset a) {},
      onlySecond: (Asset b) {
        idsToDelete.add(b.id);
      },
    );
    if (idsToDelete.isNotEmpty) {
      return _db.writeTxn(() => _db.assets.deleteAll(idsToDelete));
    }
  }

  Future<bool> verifyDbConsistency() async {
    final bool remoteInconsistent = await _db.txn(() async {
      final int remoteAssets = await _db.assets
          .where()
          .remoteIdIsNotNull()
          .remoteIdProperty()
          .count();
      final int distinctRemoteAssets = await _db.assets
          .where(distinct: true)
          .remoteIdIsNotNull()
          .distinctByRemoteId()
          .count();
      return remoteAssets != distinctRemoteAssets;
    });
    if (remoteInconsistent) {
      return false;
    }
    final bool localInconsistent = await _db.txn(() async {
      final int localAssets =
          await _db.assets.where().localIdIsNotNull().localIdProperty().count();
      final int distinctLocalAssets = await _db.assets
          .where(distinct: true)
          .localIdIsNotNull()
          .distinctByLocalId()
          .count();
      return localAssets != distinctLocalAssets;
    });
    if (localInconsistent) {
      return false;
    }

    return true;
  }
}
