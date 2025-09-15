import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:logging/logging.dart';

class HashService {
  final int _batchSize;
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
    int batchSize = kBatchHashFileLimit,
  }) : _localAlbumRepository = localAlbumRepository,
       _localAssetRepository = localAssetRepository,
       _storageRepository = storageRepository,
       _cancelChecker = cancelChecker,
       _nativeSyncApi = nativeSyncApi,
       _batchSize = batchSize;

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
        await _hashAssets(album, assetsToHash, album.backupSelection == BackupSelection.selected);
      }
    }

    stopwatch.stop();
    _log.info("Hashing took - ${stopwatch.elapsedMilliseconds}ms");
  }

  /// Processes a list of [LocalAsset]s, storing their hash and updating the assets in the DB
  /// with hash for those that were successfully hashed. Hashes are looked up in a table
  /// [LocalAssetHashEntity] by local id. Only missing entries are newly hashed and added to the DB.
  Future<void> _hashAssets(LocalAlbum album, List<LocalAsset> assetsToHash, bool allowNetworkAccess) async {
    final toHash = <String>[];

    for (final asset in assetsToHash) {
      if (isCancelled) {
        _log.warning("Hashing cancelled. Stopped processing assets.");
        return;
      }

      toHash.add(asset.id);
      if (toHash.length >= _batchSize) {
        await _processBatch(album, toHash, allowNetworkAccess);
        toHash.clear();
      }
    }

    await _processBatch(album, toHash, allowNetworkAccess);
  }

  /// Processes a batch of assets.
  Future<void> _processBatch(LocalAlbum album, List<String> toHash, bool allowNetworkAccess) async {
    if (toHash.isEmpty) {
      return;
    }

    _log.fine("Hashing ${toHash.length} files");

    final hashed = <String, String>{};
    final hashResults = await _nativeSyncApi.hashAssets(toHash, allowNetworkAccess: allowNetworkAccess);
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
        _log.warning(
          "Failed to hash file for ${hashResult.assetId} from album: ${album.name}. Error: ${hashResult.error ?? "unknown"}",
        );
      }
    }

    _log.fine("Hashed ${hashed.length}/${toHash.length} assets");

    await _localAssetRepository.updateHashes(hashed);
    await _storageRepository.clearCache();
  }
}
