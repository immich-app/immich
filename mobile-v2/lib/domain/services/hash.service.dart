import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/device_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/device_asset_hash.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/device_asset_hash.model.dart';
import 'package:immich_mobile/platform/messages.g.dart';
import 'package:immich_mobile/utils/constants/globals.dart';
import 'package:immich_mobile/utils/extensions/file.extension.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class HashService with LogMixin {
  final ImHostService _hostService;
  final IDeviceAssetRepository _deviceAssetRepository;
  final IDeviceAlbumRepository _deviceAlbumRepository;
  final IDeviceAssetToHashRepository _assetHashRepository;

  const HashService({
    required ImHostService hostService,
    required IDeviceAssetRepository deviceAssetRepo,
    required IDeviceAlbumRepository deviceAlbumRepo,
    required IDeviceAssetToHashRepository assetToHashRepo,
  })  : _hostService = hostService,
        _deviceAssetRepository = deviceAssetRepo,
        _deviceAlbumRepository = deviceAlbumRepo,
        _assetHashRepository = assetToHashRepo;

  Future<List<Asset>> getHashedAssetsForAlbum(
    String albumId, {
    DateTime? modifiedUntil,
  }) async {
    final assets = await _deviceAlbumRepository.getAssetsForAlbum(
      albumId,
      modifiedUntil: modifiedUntil,
    );
    assets.sort(Asset.compareByLocalId);

    final assetIds = assets.map((a) => a.localId!);
    final hashesInDB = await _assetHashRepository.getForIds(assetIds);
    hashesInDB.sort(DeviceAssetToHash.compareByLocalId);

    final hashedAssets = <Asset>[];
    final orphanedHashes = <DeviceAssetToHash>[];
    int bytesToBeProcessed = 0;
    final filesToBeCleaned = <File>[];
    final toBeHashed = <_AssetPath>[];

    for (final asset in assets) {
      if (hashesInDB.isNotEmpty && hashesInDB.first.localId == asset.localId) {
        final hashed = hashesInDB.removeAt(0);
        if (hashed.modifiedTime.isAtSameMomentAs(asset.modifiedTime)) {
          hashedAssets.add(asset.copyWith(hash: hashed.hash));
          continue;
        }
        // localID is matching, but the asset is modified. Discard the DeviceAssetToHash row
        orphanedHashes.add(hashed);
      }

      final file = await _deviceAssetRepository.getOriginalFile(asset.localId!);
      if (file == null) {
        log.w("Cannot obtain file for localId ${asset.localId!}. Skipping");
        continue;
      }
      filesToBeCleaned.add(file);

      bytesToBeProcessed += await file.length();
      toBeHashed.add(_AssetPath(asset: asset, path: file.path));

      if (toBeHashed.length == kHashAssetsFileLimit ||
          bytesToBeProcessed >= kHashAssetsSizeLimit) {
        hashedAssets.addAll(await _processAssetBatch(toBeHashed));
        // Clear file cache
        await Future.wait(filesToBeCleaned.map((f) => f.deleteDarwinCache()));
        toBeHashed.clear();
        filesToBeCleaned.clear();
        bytesToBeProcessed = 0;
      }
    }

    if (toBeHashed.isNotEmpty) {
      hashedAssets.addAll(await _processAssetBatch(toBeHashed));
      // Clear file cache
      await Future.wait(filesToBeCleaned.map((f) => f.deleteDarwinCache()));
    }

    assert(hashesInDB.isEmpty, "All hashes should be processed at this point");
    await _assetHashRepository
        .deleteIds(orphanedHashes.map((e) => e.id!).toList());

    return hashedAssets;
  }

  /// Processes a batch of files and returns a list of successfully hashed assets after saving
  /// them in [DeviceAssetToHash] for future retrieval
  Future<List<Asset>> _processAssetBatch(List<_AssetPath> toBeHashed) async {
    final hashes = await _hashFiles(toBeHashed.map((e) => e.path).toList());
    assert(hashes.length == toBeHashed.length,
        "Number of Hashes returned from platform should be the same as the input");

    final hashedAssets = <Asset>[];

    for (final (index, hash) in hashes.indexed) {
      final asset = toBeHashed.elementAtOrNull(index)?.asset;
      if (asset != null && hash?.length == 20) {
        hashedAssets.add(asset.copyWith(hash: base64.encode(hash!)));
      } else {
        log.w("Failed to hash file ${asset?.localId ?? '<null>'}, skipping");
      }
    }

    // Store the cache for future retrieval
    await _assetHashRepository
        .upsertAll(hashedAssets.map((a) => DeviceAssetToHash(
              localId: a.localId!,
              hash: a.hash,
              modifiedTime: a.modifiedTime,
            )));

    log.v("Hashed ${hashedAssets.length}/${toBeHashed.length} assets");
    return hashedAssets;
  }

  /// Hashes the given files and returns a list of the same length.
  /// Files that could not be hashed will have a `null` value
  Future<List<Uint8List?>> _hashFiles(List<String> paths) async {
    try {
      return await _hostService.digestFiles(paths);
    } catch (e, s) {
      log.e("Error occured while hashing assets", e, s);
    }

    return paths.map((p) => null).toList();
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
