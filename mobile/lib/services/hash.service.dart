import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/device_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/device_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/device_asset.provider.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:logging/logging.dart';

class HashService {
  HashService({
    required IsarDeviceAssetRepository deviceAssetRepository,
    required BackgroundService backgroundService,
    this.batchSizeLimit = kBatchHashSizeLimit,
    int? batchFileLimit,
  }) : _deviceAssetRepository = deviceAssetRepository,
       _backgroundService = backgroundService,
       batchFileLimit = batchFileLimit ?? kBatchHashFileLimit;

  final IsarDeviceAssetRepository _deviceAssetRepository;
  final BackgroundService _backgroundService;
  final int batchSizeLimit;
  final int batchFileLimit;
  final _log = Logger('HashService');

  /// Processes a list of local [Asset]s, storing their hash and returning only those
  /// that were successfully hashed. Hashes are looked up in a DB table
  /// [DeviceAsset] by local id. Only missing entries are newly hashed and added to the DB table.
  Future<List<Asset>> hashAssets(List<Asset> assets) async {
    assets.sort(Asset.compareByLocalId);

    // Get and sort DB entries - guaranteed to be a subset of assets
    final hashesInDB = await _deviceAssetRepository.getByIds(assets.map((a) => a.localId!).toList());
    hashesInDB.sort((a, b) => a.assetId.compareTo(b.assetId));

    int dbIndex = 0;
    int bytesProcessed = 0;
    final hashedAssets = <Asset>[];
    final toBeHashed = <_AssetPath>[];
    final toBeDeleted = <String>[];

    for (int assetIndex = 0; assetIndex < assets.length; assetIndex++) {
      final asset = assets[assetIndex];
      DeviceAsset? matchingDbEntry;

      if (dbIndex < hashesInDB.length) {
        final deviceAsset = hashesInDB[dbIndex];
        if (deviceAsset.assetId == asset.localId) {
          matchingDbEntry = deviceAsset;
          dbIndex++;
        }
      }

      if (matchingDbEntry != null &&
          matchingDbEntry.hash.isNotEmpty &&
          matchingDbEntry.modifiedTime.isAtSameMomentAs(asset.fileModifiedAt)) {
        // Reuse the existing hash
        hashedAssets.add(asset.copyWith(checksum: base64.encode(matchingDbEntry.hash)));
        continue;
      }

      final file = await _tryGetAssetFile(asset);
      if (file == null) {
        // Can't access file, delete any DB entry
        if (matchingDbEntry != null) {
          toBeDeleted.add(matchingDbEntry.assetId);
        }
        continue;
      }

      bytesProcessed += await file.length();
      toBeHashed.add(_AssetPath(asset: asset, path: file.path));

      if (_shouldProcessBatch(toBeHashed.length, bytesProcessed)) {
        hashedAssets.addAll(await _processBatch(toBeHashed, toBeDeleted));
        toBeHashed.clear();
        toBeDeleted.clear();
        bytesProcessed = 0;
      }
    }
    assert(dbIndex == hashesInDB.length, "All hashes should've been processed");

    // Process any remaining files
    if (toBeHashed.isNotEmpty) {
      hashedAssets.addAll(await _processBatch(toBeHashed, toBeDeleted));
    }

    // Clean up deleted references
    if (toBeDeleted.isNotEmpty) {
      await _deviceAssetRepository.deleteIds(toBeDeleted);
    }

    return hashedAssets;
  }

  bool _shouldProcessBatch(int assetCount, int bytesProcessed) =>
      assetCount >= batchFileLimit || bytesProcessed >= batchSizeLimit;

  Future<File?> _tryGetAssetFile(Asset asset) async {
    try {
      final file = await asset.local!.originFile;
      if (file == null) {
        _log.warning(
          "Failed to get file for asset ${asset.localId ?? '<N/A>'}, name: ${asset.fileName}, created on: ${asset.fileCreatedAt}, skipping",
        );
        return null;
      }
      return file;
    } catch (error, stackTrace) {
      _log.warning(
        "Error getting file to hash for asset ${asset.localId ?? '<N/A>'}, name: ${asset.fileName}, created on: ${asset.fileCreatedAt}, skipping",
        error,
        stackTrace,
      );
      return null;
    }
  }

  /// Processes a batch of files and returns a list of successfully hashed assets after saving
  /// them in [DeviceAssetToHash] for future retrieval
  Future<List<Asset>> _processBatch(List<_AssetPath> toBeHashed, List<String> toBeDeleted) async {
    _log.info("Hashing ${toBeHashed.length} files");
    final hashes = await _hashFiles(toBeHashed.map((e) => e.path).toList());
    assert(
      hashes.length == toBeHashed.length,
      "Number of Hashes returned from platform should be the same as the input",
    );

    final hashedAssets = <Asset>[];
    final toBeAdded = <DeviceAsset>[];

    for (final (index, hash) in hashes.indexed) {
      final asset = toBeHashed.elementAtOrNull(index)?.asset;
      if (asset != null && hash?.length == 20) {
        hashedAssets.add(asset.copyWith(checksum: base64.encode(hash!)));
        toBeAdded.add(DeviceAsset(assetId: asset.localId!, hash: hash, modifiedTime: asset.fileModifiedAt));
      } else {
        _log.warning("Failed to hash file ${asset?.localId ?? '<null>'}");
        if (asset != null) {
          toBeDeleted.add(asset.localId!);
        }
      }
    }

    // Update the DB for future retrieval
    await _deviceAssetRepository.transaction(() async {
      await _deviceAssetRepository.updateAll(toBeAdded);
      await _deviceAssetRepository.deleteIds(toBeDeleted);
    });

    _log.fine("Hashed ${hashedAssets.length}/${toBeHashed.length} assets");
    return hashedAssets;
  }

  /// Hashes the given files and returns a list of the same length.
  /// Files that could not be hashed will have a `null` value
  Future<List<Uint8List?>> _hashFiles(List<String> paths) async {
    try {
      final hashes = await _backgroundService.digestFiles(paths);
      if (hashes != null) {
        return hashes;
      }
      _log.severe("Hashing ${paths.length} files failed");
    } catch (e, s) {
      _log.severe("Error occurred while hashing assets", e, s);
    }
    return List.filled(paths.length, null);
  }
}

class _AssetPath {
  final Asset asset;
  final String path;

  const _AssetPath({required this.asset, required this.path});

  _AssetPath copyWith({Asset? asset, String? path}) {
    return _AssetPath(asset: asset ?? this.asset, path: path ?? this.path);
  }
}

final hashServiceProvider = Provider(
  (ref) => HashService(
    deviceAssetRepository: ref.watch(deviceAssetRepositoryProvider),
    backgroundService: ref.watch(backgroundServiceProvider),
  ),
);
