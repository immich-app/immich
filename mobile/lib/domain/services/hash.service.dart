import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/storage.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/local_asset_hash.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset_hash.entity.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/presentation/pages/dev/dev_logger.dart';
import 'package:logging/logging.dart';

class HashService {
  final int batchSizeLimit;
  final int batchFileLimit;
  final ILocalAlbumRepository _localAlbumRepository;
  final ILocalAssetHashRepository _localAssetHashRepository;
  final IStorageRepository _storageRepository;
  final NativeSyncApi _nativeSyncApi;
  final _log = Logger('HashService');

  HashService({
    required ILocalAlbumRepository localAlbumRepository,
    required ILocalAssetHashRepository localAssetHashRepository,
    required IStorageRepository storageRepository,
    required NativeSyncApi nativeSyncApi,
    this.batchSizeLimit = kBatchHashSizeLimit,
    this.batchFileLimit = kBatchHashFileLimit,
  })  : _localAlbumRepository = localAlbumRepository,
        _localAssetHashRepository = localAssetHashRepository,
        _storageRepository = storageRepository,
        _nativeSyncApi = nativeSyncApi;

  Future<void> hashAssets() async {
    final Stopwatch stopwatch = Stopwatch()..start();
    // Sorted by backupSelection followed by isCloud
    final localAlbums = await _localAlbumRepository.getAll();
    localAlbums.sort((a, b) {
      final backupComparison =
          a.backupSelection.sortOrder.compareTo(b.backupSelection.sortOrder);

      if (backupComparison != 0) {
        return backupComparison;
      }

      // Local albums come before iCloud albums
      return (a.isIosSharedAlbum ? 1 : 0).compareTo(b.isIosSharedAlbum ? 1 : 0);
    });

    for (final album in localAlbums) {
      final unHashedAssets =
          await _localAlbumRepository.getUnHashedAssets(album.id);
      if (unHashedAssets.isNotEmpty) {
        await _hashAssets(unHashedAssets);
      }
    }

    stopwatch.stop();
    _log.info("Hashing took - ${stopwatch.elapsedMilliseconds}ms");
    DLog.log("Hashing took - ${stopwatch.elapsedMilliseconds}ms");
  }

  /// Processes a list of [LocalAsset]s, storing their hash and updating the assets in the DB
  /// with hash for those that were successfully hashed. Hashes are looked up in a table
  /// [LocalAssetHashEntity] by local id. Only missing entries are newly hashed and added to the DB.
  Future<void> _hashAssets(List<LocalAsset> unHashedAssets) async {
    final existingHashes = await _localAssetHashRepository
        .getByIds(unHashedAssets.map((a) => a.id));

    assert(unHashedAssets.isSorted((a, b) => a.id.compareTo(b.id)));
    assert(existingHashes.isSorted((a, b) => a.id.compareTo(b.id)));

    int dbIndex = 0;
    int bytesProcessed = 0;
    final hashedAssets = <LocalAsset>[];
    final toBeHashed = <_AssetPath>[];
    final toBeDeleted = <String>[];

    for (final asset in unHashedAssets) {
      LocalAssetHash? existingHash;

      if (dbIndex < existingHashes.length &&
          existingHashes[dbIndex].id == asset.id) {
        existingHash = existingHashes[dbIndex++];
      }

      // Reuse existing hash if valid
      if (existingHash?.checksum.isNotEmpty == true &&
          existingHash!.updatedAt.isAtSameMomentAs(asset.updatedAt)) {
        hashedAssets.add(asset.copyWith(checksum: existingHash.checksum));
        continue;
      }

      final file = await _storageRepository.getFileForAsset(asset);
      if (file == null) {
        // Can't access file, delete any DB entry
        if (existingHash != null) {
          toBeDeleted.add(existingHash.id);
        }
        continue;
      }

      bytesProcessed += await file.length();
      toBeHashed.add(_AssetPath(asset: asset, path: file.path));

      if (toBeHashed.length >= batchFileLimit ||
          bytesProcessed >= batchSizeLimit) {
        await _processBatch(toBeHashed, hashedAssets, toBeDeleted);
        toBeHashed.clear();
        toBeDeleted.clear();
        hashedAssets.clear();
        bytesProcessed = 0;
      }
    }
    assert(dbIndex == existingHashes.length, "All hashes should be processed");

    // Process any remaining assets
    await _processBatch(toBeHashed, hashedAssets, toBeDeleted);
  }

  /// Processes a batch of assets.
  Future<void> _processBatch(
    List<_AssetPath> toBeHashed,
    List<LocalAsset> hashedAssets,
    List<String> toBeDeleted,
  ) async {
    _log.fine("Hashing ${toBeHashed.length} files");

    if (toBeHashed.isNotEmpty) {
      final hashes = await _nativeSyncApi
          .hashPaths(toBeHashed.map((e) => e.path).toList());

      for (final (index, hash) in hashes.indexed) {
        final asset = toBeHashed[index].asset;
        if (hash?.length == 20) {
          hashedAssets.add(asset.copyWith(checksum: base64.encode(hash!)));
        } else {
          _log.warning("Failed to hash file ${asset.id}");
          toBeDeleted.add(asset.id);
        }
      }

      _log.fine("Hashed ${hashedAssets.length}/${toBeHashed.length} assets");
    }

    await _localAlbumRepository.upsertAssets(hashedAssets);
    await _localAssetHashRepository.handleDelta(
      updates: hashedAssets,
      deletes: toBeDeleted,
    );
  }
}

class _AssetPath {
  final LocalAsset asset;
  final String path;

  const _AssetPath({required this.asset, required this.path});
}
