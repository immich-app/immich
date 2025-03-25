// ignore_for_file: avoid-unsafe-collection-methods

import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/models/device_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/infrastructure/device_asset.provider.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:logging/logging.dart';

class HashService {
  HashService({
    required IDeviceAssetRepository deviceAssetRepository,
    required BackgroundService backgroundService,
  })  : _deviceAssetRepository = deviceAssetRepository,
        _backgroundService = backgroundService;

  final IDeviceAssetRepository _deviceAssetRepository;
  final BackgroundService _backgroundService;
  final _log = Logger('HashService');

  /// Processes a list of local [Asset]s, storing their hash and returning only those
  /// that were successfully hashed. Hashes are looked up in a DB table
  /// [DeviceAsset] by local id. Only missing entries are newly hashed and added to the DB table.
  Future<List<Asset>> hashAssets(List<Asset> assets) async {
    assets.sort(Asset.compareByLocalId);
    final hashesInDB = await _deviceAssetRepository
        .getForIds(assets.map((a) => a.localId!).toList());
    hashesInDB.sort((a, b) => a.assetId.compareTo(b.assetId));

    int bytesProcessed = 0;
    final hashedAssets = <Asset>[];
    final toBeHashed = <_AssetPath>[];
    final toBeDeleted = <String>[];

    for (final (index, asset) in assets.indexed) {
      if (hashesInDB.elementAtOrNull(index) != null &&
          hashesInDB[index].assetId == assets[index].localId &&
          hashesInDB[index].hash.isNotEmpty &&
          hashesInDB[index]
              .modifiedTime
              .isAtSameMomentAs(assets[index].fileModifiedAt)) {
        // localID is matching and the asset is not modified, reuse the hash
        asset.byteHash = hashesInDB[index].hash;
        hashedAssets.add(asset);
        continue;
      }

      File? file;
      try {
        file = await assets[index].local!.originFile;
      } catch (error, stackTrace) {
        _log.warning(
          "Error getting file to hash for asset ${assets[index].localId ?? '<N/A>'}, name: ${assets[index].fileName}, created on: ${assets[index].fileCreatedAt}, skipping",
          error,
          stackTrace,
        );
      }

      if (file == null) {
        final fileName = assets[index].fileName;
        _log.warning(
          "Failed to get file for asset ${assets[index].localId ?? '<N/A>'}, name: $fileName, created on: ${assets[index].fileCreatedAt}, skipping",
        );
        // We do not have a matching meta in DeviceAsset and we cannot get the file. Skip this asset.
        toBeDeleted.add(assets[index].localId!);
        continue;
      }

      bytesProcessed += await file.length();
      toBeHashed.add(_AssetPath(asset: asset, path: file.path));

      if (toBeHashed.length == kHashAssetsFileLimit ||
          bytesProcessed >= kHashAssetsSizeLimit) {
        hashedAssets.addAll(await _processBatch(toBeHashed, toBeDeleted));
        toBeHashed.clear();
        toBeDeleted.clear();
        bytesProcessed = 0;
      }
    }

    if (toBeHashed.isNotEmpty) {
      hashedAssets.addAll(await _processBatch(toBeHashed, toBeDeleted));
      toBeHashed.clear();
      toBeDeleted.clear();
    }

    if (toBeDeleted.isNotEmpty) {
      await _deviceAssetRepository.deleteIds(toBeDeleted);
    }

    return hashedAssets;
  }

  /// Processes a batch of files and returns a list of successfully hashed assets after saving
  /// them in [DeviceAssetToHash] for future retrieval
  Future<List<Asset>> _processBatch(
    List<_AssetPath> toBeHashed,
    List<String> toBeDeleted,
  ) async {
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
        asset.byteHash = hash!;
        hashedAssets.add(asset);
        toBeAdded.add(
          DeviceAsset(
            assetId: asset.localId!,
            hash: hash,
            modifiedTime: asset.fileModifiedAt,
          ),
        );
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
      _log.severe("Error occured while hashing assets", e, s);
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
