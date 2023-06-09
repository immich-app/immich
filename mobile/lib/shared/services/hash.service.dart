import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/shared/models/android_device_asset.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/device_asset.dart';
import 'package:immich_mobile/shared/models/ios_device_asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class HashService {
  HashService(this._db, this._backgroundService);
  final Isar _db;
  final BackgroundService _backgroundService;
  final _log = Logger('HashService');

  /// Returns all assets that were successfully hashed
  Future<List<Asset>> getHashedAssets(
    AssetPathEntity album, {
    int start = 0,
    int end = 0x7fffffffffffffff,
    Set<String>? excludedAssets,
  }) async {
    final entities = await album.getAssetListRange(start: start, end: end);
    final filtered = excludedAssets == null
        ? entities
        : entities.where((e) => !excludedAssets.contains(e.id)).toList();
    return _hashAssets(filtered);
  }

  /// Converts a list of [AssetEntity]s to [Asset]s including only those
  /// that were successfully hashed. Hashes are looked up in a DB table
  /// [AndroidDeviceAsset] / [IOSDeviceAsset] by local id. Only missing
  /// entries are newly hashed and added to the DB table.
  Future<List<Asset>> _hashAssets(List<AssetEntity> assetEntities) async {
    const int batchFileCount = 128;
    const int batchDataSize = 1024 * 1024 * 1024; // 1GB

    final ids = assetEntities
        .map(Platform.isAndroid ? (a) => a.id.toInt() : (a) => a.id)
        .toList();
    final List<DeviceAsset?> hashes = await _lookupHashes(ids);
    final List<DeviceAsset> toAdd = [];
    final List<String> toHash = [];

    int bytes = 0;

    for (int i = 0; i < assetEntities.length; i++) {
      if (hashes[i] != null) {
        continue;
      }
      final file = await assetEntities[i].originFile;
      if (file == null) {
        _log.warning(
          "Failed to get file for asset ${assetEntities[i].id}, skipping",
        );
        continue;
      }
      bytes += await file.length();
      toHash.add(file.path);
      final deviceAsset = Platform.isAndroid
          ? AndroidDeviceAsset(id: ids[i] as int, hash: const [])
          : IOSDeviceAsset(id: ids[i] as String, hash: const []);
      toAdd.add(deviceAsset);
      hashes[i] = deviceAsset;
      if (toHash.length == batchFileCount || bytes >= batchDataSize) {
        await _processBatch(toHash, toAdd);
        toAdd.clear();
        toHash.clear();
        bytes = 0;
      }
    }
    if (toHash.isNotEmpty) {
      await _processBatch(toHash, toAdd);
    }
    return _mapAllHashedAssets(assetEntities, hashes);
  }

  /// Lookup hashes of assets by their local ID
  Future<List<DeviceAsset?>> _lookupHashes(List<Object> ids) =>
      Platform.isAndroid
          ? _db.androidDeviceAssets.getAll(ids.cast())
          : _db.iOSDeviceAssets.getAllById(ids.cast());

  /// Processes a batch of files and saves any successfully hashed
  /// values to the DB table.
  Future<void> _processBatch(
    final List<String> toHash,
    final List<DeviceAsset> toAdd,
  ) async {
    final hashes = await _hashFiles(toHash);
    bool anyNull = false;
    for (int j = 0; j < hashes.length; j++) {
      if (hashes[j]?.length == 20) {
        toAdd[j].hash = hashes[j]!;
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
  }

  /// Hashes the given files and returns a list of the same length
  /// files that could not be hashed have a `null` value
  Future<List<Uint8List?>> _hashFiles(List<String> paths) async {
    if (Platform.isAndroid) {
      final List<Uint8List?>? hashes =
          await _backgroundService.digestFiles(paths);
      if (hashes == null) {
        throw Exception("Hashing ${paths.length} files failed");
      }
      return hashes;
    } else if (Platform.isIOS) {
      final List<Uint8List?> result = List.filled(paths.length, null);
      for (int i = 0; i < paths.length; i++) {
        result[i] = await _hashAssetDart(File(paths[i]));
      }
      return result;
    } else {
      throw Exception("_hashFiles implementation missing");
    }
  }

  /// Hashes a single file using Dart's crypto package
  Future<Uint8List?> _hashAssetDart(File f) async {
    late Digest output;
    final sink = sha1.startChunkedConversion(
      ChunkedConversionSink<Digest>.withCallback((accumulated) {
        output = accumulated.first;
      }),
    );
    await for (final chunk in f.openRead()) {
      sink.add(chunk);
    }
    sink.close();
    return Uint8List.fromList(output.bytes);
  }

  /// Converts [AssetEntity]s that were successfully hashed to [Asset]s
  List<Asset> _mapAllHashedAssets(
    List<AssetEntity> assets,
    List<DeviceAsset?> hashes,
  ) {
    final List<Asset> result = [];
    for (int i = 0; i < assets.length; i++) {
      if (hashes[i] != null && hashes[i]!.hash.isNotEmpty) {
        result.add(Asset.local(assets[i], hashes[i]!.hash));
      }
    }
    return result;
  }
}

final hashServiceProvider = Provider(
  (ref) => HashService(
    ref.watch(dbProvider),
    ref.watch(backgroundServiceProvider),
  ),
);
