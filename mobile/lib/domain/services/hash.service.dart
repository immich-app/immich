import 'dart:convert';

import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:logging/logging.dart';

class HashService {
  final int batchSizeLimit;
  final int batchFileLimit;
  final DriftLocalAlbumRepository _localAlbumRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final StorageRepository _storageRepository;
  final NativeSyncApi _nativeSyncApi;
  final bool Function()? _cancelChecker;
  final _log = Logger('HashService');

  HashService({
    required DriftLocalAlbumRepository localAlbumRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required StorageRepository storageRepository,
    required NativeSyncApi nativeSyncApi,
    bool Function()? cancelChecker,
    this.batchSizeLimit = kBatchHashSizeLimit,
    this.batchFileLimit = kBatchHashFileLimit,
  }) : _localAlbumRepository = localAlbumRepository,
       _localAssetRepository = localAssetRepository,
       _storageRepository = storageRepository,
       _cancelChecker = cancelChecker,
       _nativeSyncApi = nativeSyncApi;

  bool get isCancelled => _cancelChecker?.call() ?? false;

  Future<void> hashAssets() async {
    _log.info("Starting hashing of assets");
    final Stopwatch stopwatch = Stopwatch()..start();
    // Sorted by backupSelection followed by isCloud
    final localAlbums = await _localAlbumRepository.getAll(
      sortBy: {SortLocalAlbumsBy.backupSelection, SortLocalAlbumsBy.isIosSharedAlbum},
    );

    for (final album in localAlbums) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing albums.");
        break;
      }

      final assetsToHash = await _localAlbumRepository.getAssetsToHash(album.id);
      if (assetsToHash.isNotEmpty) {
        await _hashAssets(album, assetsToHash);
      }
    }

    stopwatch.stop();
    _log.info("Hashing took - ${stopwatch.elapsedMilliseconds}ms");
  }

  /// Processes a list of [LocalAsset]s, storing their hash and updating the assets in the DB
  /// with hash for those that were successfully hashed. Hashes are looked up in a table
  /// [LocalAssetHashEntity] by local id. Only missing entries are newly hashed and added to the DB.
  Future<void> _hashAssets(LocalAlbum album, List<LocalAsset> assetsToHash) async {
    int bytesProcessed = 0;
    final toHash = <_AssetToPath>[];

    for (final asset in assetsToHash) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing assets.");
        return;
      }

      final file = await _storageRepository.getFileForAsset(asset.id);
      if (file == null) {
        _log.warning(
          "Cannot get file for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt} from album: ${album.name}",
        );
        continue;
      }

      bytesProcessed += await file.length();
      toHash.add(_AssetToPath(asset: asset, path: file.path));

      if (toHash.length >= batchFileLimit || bytesProcessed >= batchSizeLimit) {
        await _processBatch(album, toHash);
        toHash.clear();
        bytesProcessed = 0;
      }
    }

    await _processBatch(album, toHash);
  }

  /// Processes a batch of assets.
  Future<void> _processBatch(LocalAlbum album, List<_AssetToPath> toHash) async {
    if (toHash.isEmpty) {
      return;
    }

    _log.fine("Hashing ${toHash.length} files");

    final hashed = <LocalAsset>[];
    final hashes = await _nativeSyncApi.hashPaths(toHash.map((e) => e.path).toList());
    assert(
      hashes.length == toHash.length,
      "Hashes length does not match toHash length: ${hashes.length} != ${toHash.length}",
    );

    for (int i = 0; i < hashes.length; i++) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing batch.");
        return;
      }

      final hash = hashes[i];
      final asset = toHash[i].asset;
      if (hash?.length == 20) {
        hashed.add(asset.copyWith(checksum: base64.encode(hash!)));
      } else {
        _log.warning(
          "Failed to hash file for ${asset.id}: ${asset.name} created at ${asset.createdAt} from album: ${album.name}",
        );
      }
    }

    _log.fine("Hashed ${hashed.length}/${toHash.length} assets");

    await _localAssetRepository.updateHashes(hashed);
    await _storageRepository.clearCache();
  }
}

class _AssetToPath {
  final LocalAsset asset;
  final String path;

  const _AssetToPath({required this.asset, required this.path});
}
