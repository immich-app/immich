import 'package:flutter/services.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:logging/logging.dart';

const String _kHashCancelledCode = "HASH_CANCELLED";

/// Information about a completed hash batch
class HashBatchResult {
  /// Number of assets successfully hashed in this batch
  final int hashedCount;
  /// Total assets hashed so far
  final int totalHashedSoFar;
  /// Total assets remaining to hash
  final int remainingToHash;
  /// IDs of the assets that were just hashed
  final List<String> hashedAssetIds;

  const HashBatchResult({
    required this.hashedCount,
    required this.totalHashedSoFar,
    required this.remainingToHash,
    required this.hashedAssetIds,
  });
}

/// Callback type for when a batch of assets has been hashed
typedef OnHashBatchComplete = void Function(HashBatchResult result);

class HashService {
  final int _batchSize;
  final DriftLocalAlbumRepository _localAlbumRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftTrashedLocalAssetRepository _trashedLocalAssetRepository;
  final NativeSyncApi _nativeSyncApi;
  final bool Function()? _cancelChecker;
  final _log = Logger('HashService');
  
  /// Callback that fires when each batch completes - enables parallel upload
  OnHashBatchComplete? onBatchComplete;
  
  /// Track total hashed for progress reporting
  int _totalHashedSoFar = 0;
  int _totalToHash = 0;

  HashService({
    required DriftLocalAlbumRepository localAlbumRepository,
    required DriftLocalAssetRepository localAssetRepository,
    required DriftTrashedLocalAssetRepository trashedLocalAssetRepository,
    required NativeSyncApi nativeSyncApi,
    bool Function()? cancelChecker,
    int? batchSize,
    this.onBatchComplete,
  }) : _localAlbumRepository = localAlbumRepository,
       _localAssetRepository = localAssetRepository,
       _trashedLocalAssetRepository = trashedLocalAssetRepository,
       _cancelChecker = cancelChecker,
       _nativeSyncApi = nativeSyncApi,
       _batchSize = batchSize ?? kBatchHashFileLimit;

  bool get isCancelled => _cancelChecker?.call() ?? false;
  
  /// Sets the callback for batch completion - enables pipeline mode
  void setOnBatchComplete(OnHashBatchComplete? callback) {
    onBatchComplete = callback;
  }

  Future<void> hashAssets() async {
    return hashAssetsWithCallback(onBatchComplete: onBatchComplete);
  }
  
  /// Hash assets with an optional callback that fires after each batch.
  /// This enables the parallel pipeline where uploads can start immediately
  /// after each batch is hashed, rather than waiting for all hashing to complete.
  Future<void> hashAssetsWithCallback({OnHashBatchComplete? onBatchComplete}) async {
    _log.info("Starting hashing of assets");
    final Stopwatch stopwatch = Stopwatch()..start();
    _totalHashedSoFar = 0;
    
    try {
      // Sorted by backupSelection followed by isCloud
      final localAlbums = await _localAlbumRepository.getBackupAlbums();
      
      // Calculate total assets to hash for progress reporting
      _totalToHash = 0;
      for (final album in localAlbums) {
        final assetsToHash = await _localAlbumRepository.getAssetsToHash(album.id);
        _totalToHash += assetsToHash.length;
      }
      _log.info("Total assets to hash: $_totalToHash");

      for (final album in localAlbums) {
        if (isCancelled) {
          _log.warning("Hashing cancelled. Stopped processing albums.");
          break;
        }

        final assetsToHash = await _localAlbumRepository.getAssetsToHash(album.id);
        if (assetsToHash.isNotEmpty) {
          await _hashAssets(album, assetsToHash, onBatchComplete: onBatchComplete);
        }
      }
      if (CurrentPlatform.isAndroid && localAlbums.isNotEmpty) {
        final backupAlbumIds = localAlbums.map((e) => e.id);
        final trashedToHash = await _trashedLocalAssetRepository.getAssetsToHash(backupAlbumIds);
        if (trashedToHash.isNotEmpty) {
          final pseudoAlbum = LocalAlbum(id: '-pseudoAlbum', name: 'Trash', updatedAt: DateTime.now());
          await _hashAssets(pseudoAlbum, trashedToHash, isTrashed: true, onBatchComplete: onBatchComplete);
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

    stopwatch.stop();
    _log.info("Hashing took - ${stopwatch.elapsedMilliseconds}ms");
  }

  /// Processes a list of [LocalAsset]s, storing their hash and updating the assets in the DB
  /// with hash for those that were successfully hashed. Hashes are looked up in a table
  /// [LocalAssetHashEntity] by local id. Only missing entries are newly hashed and added to the DB.
  Future<void> _hashAssets(
    LocalAlbum album, 
    List<LocalAsset> assetsToHash, {
    bool isTrashed = false,
    OnHashBatchComplete? onBatchComplete,
  }) async {
    final toHash = <String, LocalAsset>{};

    for (final asset in assetsToHash) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing assets.");
        return;
      }

      toHash[asset.id] = asset;
      if (toHash.length == _batchSize) {
        await _processBatch(album, toHash, isTrashed, onBatchComplete: onBatchComplete);
        toHash.clear();
      }
    }

    await _processBatch(album, toHash, isTrashed, onBatchComplete: onBatchComplete);
  }

  /// Processes a batch of assets.
  Future<void> _processBatch(
    LocalAlbum album, 
    Map<String, LocalAsset> toHash, 
    bool isTrashed, {
    OnHashBatchComplete? onBatchComplete,
  }) async {
    if (toHash.isEmpty) {
      return;
    }

    _log.fine("Hashing ${toHash.length} files");

    final hashed = <String, String>{};
    final hashedIds = <String>[];
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
        hashedIds.add(hashResult.assetId);
      } else {
        final asset = toHash[hashResult.assetId];
        _log.warning(
          "Failed to hash asset with id: ${hashResult.assetId}, name: ${asset?.name}, createdAt: ${asset?.createdAt}, from album: ${album.name}. Error: ${hashResult.error ?? "unknown"}",
        );
      }
    }

    _log.fine("Hashed ${hashed.length}/${toHash.length} assets");
    if (isTrashed) {
      await _trashedLocalAssetRepository.updateHashes(hashed);
    } else {
      await _localAssetRepository.updateHashes(hashed);
    }
    
    // Update progress and notify callback
    _totalHashedSoFar += hashed.length;
    final remaining = _totalToHash - _totalHashedSoFar;
    
    // Fire callback to enable parallel uploads
    if (onBatchComplete != null && hashed.isNotEmpty) {
      _log.info("Batch complete: ${hashed.length} hashed, $_totalHashedSoFar total, $remaining remaining");
      onBatchComplete(HashBatchResult(
        hashedCount: hashed.length,
        totalHashedSoFar: _totalHashedSoFar,
        remainingToHash: remaining,
        hashedAssetIds: hashedIds,
      ));
    }
  }
}
