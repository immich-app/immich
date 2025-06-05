import 'dart:convert';

import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/storage.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/presentation/pages/dev/dev_logger.dart';
import 'package:logging/logging.dart';

class HashService {
  final int batchSizeLimit;
  final int batchFileLimit;
  final ILocalAlbumRepository _localAlbumRepository;
  final ILocalAssetRepository _localAssetRepository;
  final IStorageRepository _storageRepository;
  final NativeSyncApi _nativeSyncApi;
  final _log = Logger('HashService');

  HashService({
    required ILocalAlbumRepository localAlbumRepository,
    required ILocalAssetRepository localAssetRepository,
    required IStorageRepository storageRepository,
    required NativeSyncApi nativeSyncApi,
    this.batchSizeLimit = kBatchHashSizeLimit,
    this.batchFileLimit = kBatchHashFileLimit,
  })  : _localAlbumRepository = localAlbumRepository,
        _localAssetRepository = localAssetRepository,
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
      final assetsToHash =
          await _localAlbumRepository.getAssetsToHash(album.id);
      if (assetsToHash.isNotEmpty) {
        await _hashAssets(assetsToHash);
      }
    }

    stopwatch.stop();
    _log.info("Hashing took - ${stopwatch.elapsedMilliseconds}ms");
    DLog.log("Hashing took - ${stopwatch.elapsedMilliseconds}ms");
  }

  /// Processes a list of [LocalAsset]s, storing their hash and updating the assets in the DB
  /// with hash for those that were successfully hashed. Hashes are looked up in a table
  /// [LocalAssetHashEntity] by local id. Only missing entries are newly hashed and added to the DB.
  Future<void> _hashAssets(List<LocalAsset> assetsToHash) async {
    int bytesProcessed = 0;
    final toHash = <_AssetToPath>[];

    for (final asset in assetsToHash) {
      final file = await _storageRepository.getFileForAsset(asset);
      if (file == null) {
        continue;
      }

      bytesProcessed += await file.length();
      toHash.add(_AssetToPath(asset: asset, path: file.path));

      if (toHash.length >= batchFileLimit || bytesProcessed >= batchSizeLimit) {
        await _processBatch(toHash);
        toHash.clear();
        bytesProcessed = 0;
      }
    }

    await _processBatch(toHash);
  }

  /// Processes a batch of assets.
  Future<void> _processBatch(List<_AssetToPath> toHash) async {
    _log.fine("Hashing ${toHash.length} files");

    final hashed = <LocalAsset>[];
    if (toHash.isNotEmpty) {
      final hashes =
          await _nativeSyncApi.hashPaths(toHash.map((e) => e.path).toList());

      for (final (index, hash) in hashes.indexed) {
        final asset = toHash[index].asset;
        if (hash?.length == 20) {
          hashed.add(asset.copyWith(checksum: base64.encode(hash!)));
        } else {
          _log.warning("Failed to hash file ${asset.id}");
        }
      }

      _log.fine("Hashed ${hashed.length}/${toHash.length} assets");
      DLog.log("Hashed ${hashed.length}/${toHash.length} assets");
    }

    await _localAssetRepository.updateHashes(hashed);
  }
}

class _AssetToPath {
  final LocalAsset asset;
  final String path;

  const _AssetToPath({required this.asset, required this.path});
}
