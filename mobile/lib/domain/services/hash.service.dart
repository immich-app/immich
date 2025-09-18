import 'dart:convert';

import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/trashed_asset.model.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
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
  final TrashSyncService _trashSyncService;
  final bool Function()? _cancelChecker;
  final _log = Logger('HashService');

  HashService({
    required DriftLocalAlbumRepository localAlbumRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required StorageRepository storageRepository,
    required NativeSyncApi nativeSyncApi,
    required TrashSyncService trashSyncService,
    bool Function()? cancelChecker,
    this.batchSizeLimit = kBatchHashSizeLimit,
    this.batchFileLimit = kBatchHashFileLimit,
  }) : _localAlbumRepository = localAlbumRepository,
       _localAssetRepository = localAssetRepository,
       _storageRepository = storageRepository,
       _cancelChecker = cancelChecker,
       _nativeSyncApi = nativeSyncApi,
       _trashSyncService = trashSyncService;

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

    if (_trashSyncService.isAutoSyncMode) {
      final backupAlbums = await _localAlbumRepository.getBackupAlbums();
      for (final album in backupAlbums) {
        if (isCancelled) {
          _log.warning("Hashing cancelled. Stopped processing albums.");
          break;
        }
        final trashedToHash = await _trashSyncService.getAssetsToHash(album.id);
        if (trashedToHash.isNotEmpty) {
          await _hashTrashedAssets(album, trashedToHash);
        }
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

  Future<void> _hashTrashedAssets(LocalAlbum album, Iterable<TrashedAsset> assetsToHash) async {
    int bytesProcessed = 0;
    final toHash = <TrashedAsset>[];

    for (final asset in assetsToHash) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing assets.");
        return;
      }

      if (asset.size == null) {
        _log.warning(
          "Cannot get size for asset ${asset.id}, name: ${asset.name}, created on: ${asset.createdAt} from album: ${album.name}",
        );
        continue;
      }

      bytesProcessed += asset.size!;
      toHash.add(asset);

      if (toHash.length >= batchFileLimit || bytesProcessed >= batchSizeLimit) {
        await _processTrashedBatch(album, toHash);
        toHash.clear();
        bytesProcessed = 0;
      }
    }

    await _processTrashedBatch(album, toHash);
  }

  Future<void> _processTrashedBatch(LocalAlbum album, List<TrashedAsset> toHash) async {
    if (toHash.isEmpty) {
      return;
    }

    _log.fine("Hashing ${toHash.length} trashed files");

    final params = toHash.map((e) => TrashedAssetParams(id: e.id, type: e.type.index, albumId: album.id)).toList();
    final hashes = await _nativeSyncApi.hashTrashedAssets(params);

    assert(
      hashes.length == toHash.length,
      "Trashed Assets, Hashes length does not match toHash length: ${hashes.length} != ${toHash.length}",
    );
    final hashed = <TrashedAsset>[];

    for (int i = 0; i < hashes.length; i++) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing batch.");
        return;
      }

      final hash = hashes[i];
      final asset = toHash[i];
      if (hash?.length == 20) {
        hashed.add(asset.copyWith(checksum: base64.encode(hash!)));
      } else {
        _log.warning(
          "Failed to hash trashed file for ${asset.id}: ${asset.name} created at ${asset.createdAt} from album: ${album.name}",
        );
      }
    }

    _log.fine("Hashed ${hashed.length}/${toHash.length} trashed assets");
    await _trashSyncService.updateChecksums(hashed);
  }

  // Future<void> _hashTrashedAssets(LocalAlbum album, Iterable<TrashedAsset> assetsToHash) async {
  //   final trashedAssets = assetsToHash
  //       .map((e) => TrashedAssetParams(id: e.id, type: e.type.index, albumId: album.id))
  //       .toList();
  //
  //   final byId = <String, LocalAsset>{for (final a in assetsToHash) a.id: a};
  //
  //   final hashed = <LocalAsset>[];
  //   const chunkSize = 10;
  //
  //   for (int i = 0; i < trashedAssets.length; i += chunkSize) {
  //     if (isCancelled) {
  //       _log.warning("Hashing cancelled. Stopped processing assets.");
  //       return;
  //     }
  //     final end = (i + chunkSize <= trashedAssets.length) ? i + chunkSize : trashedAssets.length;
  //     final batch = trashedAssets.sublist(i, end);
  //
  //     List<Uint8List?> hashes;
  //     try {
  //       hashes = await _nativeSyncApi.hashTrashedAssets(batch);
  //     } catch (e, s) {
  //       _log.severe("hashTrashedAssets failed for batch [$i..${end - 1}]: $e", e, s);
  //       continue;
  //     }
  //
  //     if (hashes.length != batch.length) {
  //       _log.warning(
  //         "hashTrashedAssets returned ${hashes.length} hashes for ${batch.length} assets (batch [$i..${end - 1}]).",
  //       );
  //     }
  //
  //     final limit = hashes.length < batch.length ? hashes.length : batch.length;
  //     for (int j = 0; j < limit; j++) {
  //       if (isCancelled) {
  //         _log.warning("Hashing cancelled. Stopped processing assets.");
  //         return;
  //       }
  //       final asset = batch[j];
  //       final hash = hashes[j];
  //
  //       if (hash != null && hash.length == 20) {
  //         final localAsset = byId[asset.id];
  //         if (localAsset != null) {
  //           hashed.add(localAsset.copyWith(checksum: base64.encode(hash)));
  //         }
  //       } else {
  //         _log.warning("Failed to hash file for ${asset.id} from album: ${album.name}");
  //       }
  //     }
  //   }
  //
  //   _log.warning("updateHashes for album: ${album.name}, assets: ${hashed.map((e) => '${e.name}-${e.checksum}')}");
  //
  //   await _trashSyncService.updateHashes(hashed);
  // }
}

class _AssetToPath {
  final LocalAsset asset;
  final String path;

  const _AssetToPath({required this.asset, required this.path});
}
