import 'package:flutter/services.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset/trashed_asset.model.dart';
import 'package:immich_mobile/domain/services/trash_sync.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:logging/logging.dart';

const String _kHashCancelledCode = "HASH_CANCELLED";

class HashService {
  final int _batchSize;
  final DriftLocalAlbumRepository _localAlbumRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final NativeSyncApi _nativeSyncApi;
  final TrashSyncService _trashSyncService;
  final bool Function()? _cancelChecker;
  final _log = Logger('HashService');

  HashService({
    required DriftLocalAlbumRepository localAlbumRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required NativeSyncApi nativeSyncApi,
    required TrashSyncService trashSyncService,
    bool Function()? cancelChecker,
    int? batchSize,
  }) : _localAlbumRepository = localAlbumRepository,
       _localAssetRepository = localAssetRepository,
       _cancelChecker = cancelChecker,
       _nativeSyncApi = nativeSyncApi,
       _batchSize = batchSize ?? kBatchHashFileLimit,
       _trashSyncService = trashSyncService;

  bool get isCancelled => _cancelChecker?.call() ?? false;

  Future<void> hashAssets() async {
    _log.info("Starting hashing of assets");
    final Stopwatch stopwatch = Stopwatch()..start();
    try {
      // Sorted by backupSelection followed by isCloud
      final localAlbums = await _localAlbumRepository.getBackupAlbums();

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
    } on PlatformException catch (e) {
      if (e.code == _kHashCancelledCode) {
        _log.warning("Hashing cancelled by platform");
        return;
      }
    } catch (e, s) {
      _log.severe("Error during hashing", e, s);
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
    final toHash = <String, LocalAsset>{};

    for (final asset in assetsToHash) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing assets.");
        return;
      }

      toHash[asset.id] = asset;
      if (toHash.length == _batchSize) {
        await _processBatch(album, toHash);
        toHash.clear();
      }
    }

    await _processBatch(album, toHash);
  }

  /// Processes a batch of assets.
  Future<void> _processBatch(LocalAlbum album, Map<String, LocalAsset> toHash) async {
    if (toHash.isEmpty) {
      return;
    }

    _log.fine("Hashing ${toHash.length} files");

    final hashed = <String, String>{};
    final hashResults = await _nativeSyncApi.hashAssets(
      toHash.keys.toList(),
      allowNetworkAccess: album.backupSelection == BackupSelection.selected,
    );
    assert(
      hashResults.length == toHash.length,
      "Hashes length does not match toHash length: ${hashResults.length} != ${toHash.length}",
    );

    for (int i = 0; i < hashResults.length; i++) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing batch.");
        return;
      }

      final hashResult = hashResults[i];
      if (hashResult.hash != null) {
        hashed[hashResult.assetId] = hashResult.hash!;
      } else {
        final asset = toHash[hashResult.assetId];
        _log.warning(
          "Failed to hash asset with id: ${hashResult.assetId}, name: ${asset?.name}, createdAt: ${asset?.createdAt}, from album: ${album.name}. Error: ${hashResult.error ?? "unknown"}",
        );
      }
    }

    _log.fine("Hashed ${hashed.length}/${toHash.length} assets");

    await _localAssetRepository.updateHashes(hashed);
  }

  Future<void> _hashTrashedAssets(LocalAlbum album, Iterable<TrashedAsset> assetsToHash) async {
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

      toHash.add(asset);

      if (toHash.length == _batchSize) {
        await _processTrashedBatch(album, toHash);
        toHash.clear();
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
    final hashResults = await _nativeSyncApi.hashTrashedAssets(params);

    assert(
      hashResults.length == toHash.length,
      "Trashed Assets, Hashes length does not match toHash length: ${hashResults.length} != ${toHash.length}",
    );
    final hashed = <TrashedAsset>[];

    for (int i = 0; i < hashResults.length; i++) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing batch.");
        return;
      }

      final hashResult = hashResults[i];
      final asset = toHash[i];
      if (hashResult.hash != null) {
        hashed.add(asset.copyWith(checksum: hashResult.hash!));
      } else {
        _log.warning(
          "Failed to hash trashed asset with id: ${hashResult.assetId}, name: ${asset.name}, createdAt: ${asset.createdAt}, from album: ${album.name}. Error: ${hashResult.error ?? "unknown"}",
        );
      }
    }

    _log.fine("Hashed ${hashed.length}/${toHash.length} trashed assets");
    await _trashSyncService.updateChecksums(hashed);
  }
}
