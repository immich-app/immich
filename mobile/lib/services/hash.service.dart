import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/interfaces/album_media.interface.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/repositories/album_media.repository.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/device_asset.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:logging/logging.dart';

class HashService {
  HashService(
    this._assetRepository,
    this._backgroundService,
    this._albumMediaRepository,
  );
  final IAssetRepository _assetRepository;
  final BackgroundService _backgroundService;
  final IAlbumMediaRepository _albumMediaRepository;
  final _log = Logger('HashService');

  /// Returns all assets that were successfully hashed
  Future<List<Asset>> getHashedAssets(
    Album album, {
    int start = 0,
    int end = 0x7fffffffffffffff,
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
    Set<String>? excludedAssets,
  }) async {
    final entities = await _albumMediaRepository.getAssets(
      album.localId!,
      start: start,
      end: end,
      modifiedFrom: modifiedFrom,
      modifiedUntil: modifiedUntil,
    );
    final filtered = excludedAssets == null
        ? entities
        : entities.where((e) => !excludedAssets.contains(e.localId!)).toList();
    return _hashAssets(filtered);
  }

  /// Processes a list of local [Asset]s, storing their hash and returning only those
  /// that were successfully hashed. Hashes are looked up in a DB table
  /// [AndroidDeviceAsset] / [IOSDeviceAsset] by local id. Only missing
  /// entries are newly hashed and added to the DB table.
  Future<List<Asset>> _hashAssets(List<Asset> assets) async {
    const int batchFileCount = 128;
    const int batchDataSize = 1024 * 1024 * 1024; // 1GB

    final ids = assets
        .map(Platform.isAndroid ? (a) => a.localId!.toInt() : (a) => a.localId!)
        .toList();
    final List<DeviceAsset?> hashes =
        await _assetRepository.getDeviceAssetsById(ids);
    final List<DeviceAsset> toAdd = [];
    final List<String> toHash = [];

    int bytes = 0;

    for (int i = 0; i < assets.length; i++) {
      if (hashes[i] != null) {
        continue;
      }

      File? file;

      try {
        file = await assets[i].local!.originFile;
      } catch (error, stackTrace) {
        _log.warning(
          "Error getting file to hash for asset ${assets[i].localId}, name: ${assets[i].fileName}, created on: ${assets[i].fileCreatedAt}, skipping",
          error,
          stackTrace,
        );
      }

      if (file == null) {
        final fileName = assets[i].fileName;

        _log.warning(
          "Failed to get file for asset ${assets[i].localId}, name: $fileName, created on: ${assets[i].fileCreatedAt}, skipping",
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
    return _getHashedAssets(assets, hashes);
  }

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

    await _assetRepository
        .transaction(() => _assetRepository.upsertDeviceAssets(validHashes));
    _log.fine("Hashed ${validHashes.length}/${toHash.length} assets");
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

  /// Returns all successfully hashed [Asset]s with their hash value set
  List<Asset> _getHashedAssets(
    List<Asset> assets,
    List<DeviceAsset?> hashes,
  ) {
    final List<Asset> result = [];
    for (int i = 0; i < assets.length; i++) {
      if (hashes[i] != null && hashes[i]!.hash.isNotEmpty) {
        assets[i].byteHash = hashes[i]!.hash;
        result.add(assets[i]);
      }
    }
    return result;
  }
}

final hashServiceProvider = Provider(
  (ref) => HashService(
    ref.watch(assetRepositoryProvider),
    ref.watch(backgroundServiceProvider),
    ref.watch(albumMediaRepositoryProvider),
  ),
);
