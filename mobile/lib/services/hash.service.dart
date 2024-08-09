import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/device_asset.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class HashService {
  HashService(this._db, this._backgroundService);
  final Isar _db;
  final BackgroundService _backgroundService;
  final _log = Logger('HashService');

  /// Returns all assets that were successfully hashed
  Stream<List<Asset>> getHashedAssets(
    AssetPathEntity album, {
    int start = 0,
    int end = 0x7fffffffffffffff,
  }) async* {
    final entities = await album.getAssetListRange(start: start, end: end);
    entities.sortBy((e) => e.id);
    await for (final assets in _hashAssets(entities)) {
      yield assets;
    }
  }

  /// Converts a list of [AssetEntity]s to [Asset]s including only those
  /// that were successfully hashed. Hashes are looked up in a DB table
  /// [AndroidDeviceAsset] / [IOSDeviceAsset] by local id. Only missing
  /// entries are newly hashed and added to the DB table.
  Stream<List<Asset>> _hashAssets(List<AssetEntity> assetEntities) async* {
    const int batchFileCount = 128;
    const int batchDataSize = 1024 * 1024 * 1024; // 1GB

    final ids = assetEntities
        .map(Platform.isAndroid ? (a) => a.id.toInt() : (a) => a.id)
        .toList();
    final List<DeviceAsset?> hashes = await _lookupHashes(ids);
    final List<DeviceAsset> toAdd = [];
    final List<Map<String, AssetEntity>> toHash = [];

    int bytes = 0;

    for (int i = 0; i < assetEntities.length; i++) {
      if (hashes[i] != null) {
        continue;
      }
      final file = await assetEntities[i].originFile;
      if (file == null) {
        final fileName = await assetEntities[i].titleAsync.catchError((error) {
          _log.warning(
            "Failed to get title for asset ${assetEntities[i].id}",
          );

          return "";
        });

        _log.warning(
          "Failed to get file for asset ${assetEntities[i].id}, name: $fileName, created on: ${assetEntities[i].createDateTime}, skipping",
        );
        continue;
      }
      bytes += await file.length();
      toHash.add({file.path: assetEntities[i]});
      final deviceAsset = Platform.isAndroid
          ? AndroidDeviceAsset(id: ids[i] as int, hash: const [])
          : IOSDeviceAsset(id: ids[i] as String, hash: const []);
      toAdd.add(deviceAsset);
      hashes[i] = deviceAsset;
      if (toHash.length == batchFileCount || bytes >= batchDataSize) {
        await for (final batch in _processBatch(toHash, toAdd)) {
          yield batch;
        }
        toAdd.clear();
        toHash.clear();
        bytes = 0;
      }
    }
    if (toHash.isNotEmpty) {
      await for (final batch in _processBatch(toHash, toAdd)) {
        yield batch;
      }
    }
  }

  /// Lookup hashes of assets by their local ID
  Future<List<DeviceAsset?>> _lookupHashes(List<Object> ids) =>
      Platform.isAndroid
          ? _db.androidDeviceAssets.getAll(ids.cast())
          : _db.iOSDeviceAssets.getAllById(ids.cast());

  /// Processes a batch of files and saves any successfully hashed
  /// values to the DB table.
  Stream<List<Asset>> _processBatch(
    final List<Map<String, AssetEntity>> toHash,
    final List<DeviceAsset> toAdd,
  ) async* {
    final List<Asset> validLocalAssets = [];
    final hashes = await _hashFiles(toHash.map((e) => e.keys.first).toList());
    bool anyNull = false;
    for (int j = 0; j < hashes.length; j++) {
      if (hashes[j]?.length == 20) {
        toAdd[j].hash = hashes[j]!;
        validLocalAssets.add(Asset.local(toHash[j].values.first, hashes[j]!));
      } else {
        _log.warning("Failed to hash file ${toHash[j]}, skipping");
        anyNull = true;
      }
    }

    final validHashes = anyNull
        ? toAdd.where((e) => e.hash.length == 20).toList(growable: false)
        : toAdd;

    await _db.writeTxn(
      () => Platform.isAndroid
          ? _db.androidDeviceAssets.putAll(validHashes.cast())
          : _db.iOSDeviceAssets.putAll(validHashes.cast()),
    );
    _log.fine("Hashed ${validHashes.length}/${toHash.length} assets");
    yield validLocalAssets;
  }

  /// Hashes the given files and returns a list of the same length
  /// files that could not be hashed have a `null` value
  Future<List<Uint8List?>> _hashFiles(List<String> paths) async {
    final List<Uint8List?>? hashes =
        await _backgroundService.digestFiles(paths);
    if (hashes == null) {
      throw Exception("Hashing ${paths.length} files failed");
    }
    return hashes;
  }
}

final hashServiceProvider = Provider(
  (ref) => HashService(
    ref.watch(dbProvider),
    ref.watch(backgroundServiceProvider),
  ),
);
