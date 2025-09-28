import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/utils/datetime_helpers.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:logging/logging.dart';

class LocalSyncService {
  final DriftLocalAlbumRepository _localAlbumRepository;
  final NativeSyncApi _nativeSyncApi;
  final Logger _log = Logger("DeviceSyncService");

  LocalSyncService({required DriftLocalAlbumRepository localAlbumRepository, required NativeSyncApi nativeSyncApi})
    : _localAlbumRepository = localAlbumRepository,
      _nativeSyncApi = nativeSyncApi;

  Future<void> sync({bool full = false}) async {
    final Stopwatch stopwatch = Stopwatch()..start();
    try {
      if (full || await _nativeSyncApi.shouldFullSync()) {
        _log.fine("Full sync request from ${full ? "user" : "native"}");
        return await fullSync();
      }

      final delta = await _nativeSyncApi.getMediaChanges();
      if (!delta.hasChanges) {
        _log.fine("No media changes detected. Skipping sync");
        return;
      }

      _log.fine("Delta updated: ${delta.updates.length}");
      _log.fine("Delta deleted: ${delta.deletes.length}");

      final deviceAlbums = await _nativeSyncApi.getAlbums();
      await _localAlbumRepository.updateAll(deviceAlbums.toLocalAlbums());
      await _localAlbumRepository.processDelta(
        updates: delta.updates.toLocalAssets(),
        deletes: delta.deletes,
        assetAlbums: delta.assetAlbums,
      );

      final dbAlbums = await _localAlbumRepository.getAll();
      // On Android, we need to sync all albums since it is not possible to
      // detect album deletions from the native side
      if (CurrentPlatform.isAndroid) {
        for (final album in dbAlbums) {
          final deviceIds = await _nativeSyncApi.getAssetIdsForAlbum(album.id);
          await _localAlbumRepository.syncDeletes(album.id, deviceIds);
        }
      }

      if (CurrentPlatform.isIOS) {
        // On iOS, we need to full sync albums that are marked as cloud as the delta sync
        // does not include changes for cloud albums. If ignoreIcloudAssets is enabled,
        // remove the albums from the local database from the previous sync
        final cloudAlbums = deviceAlbums.where((a) => a.isCloud).toLocalAlbums();
        for (final album in cloudAlbums) {
          final dbAlbum = dbAlbums.firstWhereOrNull((a) => a.id == album.id);
          if (dbAlbum == null) {
            _log.warning("Cloud album ${album.name} not found in local database. Skipping sync.");
            continue;
          }
          await updateAlbum(dbAlbum, album);
        }
      }

      await _nativeSyncApi.checkpointSync();
    } catch (e, s) {
      _log.severe("Error performing device sync", e, s);
    } finally {
      stopwatch.stop();
      _log.info("Device sync took - ${stopwatch.elapsedMilliseconds}ms");
    }
  }

  Future<void> fullSync() async {
    try {
      final Stopwatch stopwatch = Stopwatch()..start();

      final deviceAlbums = await _nativeSyncApi.getAlbums();
      final dbAlbums = await _localAlbumRepository.getAll(sortBy: {SortLocalAlbumsBy.id});

      await diffSortedLists(
        dbAlbums,
        deviceAlbums.toLocalAlbums(),
        compare: (a, b) => a.id.compareTo(b.id),
        both: updateAlbum,
        onlyFirst: removeAlbum,
        onlySecond: addAlbum,
      );

      await _nativeSyncApi.checkpointSync();
      stopwatch.stop();
      _log.info("Full device sync took - ${stopwatch.elapsedMilliseconds}ms");
    } catch (e, s) {
      _log.severe("Error performing full device sync", e, s);
    }
  }

  Future<void> addAlbum(LocalAlbum album) async {
    try {
      _log.fine("Adding device album ${album.name}");

      final assets = album.assetCount > 0 ? await _nativeSyncApi.getAssetsForAlbum(album.id) : <PlatformAsset>[];

      await _localAlbumRepository.upsert(album, toUpsert: assets.toLocalAssets());
      _log.fine("Successfully added device album ${album.name}");
    } catch (e, s) {
      _log.warning("Error while adding device album", e, s);
    }
  }

  Future<void> removeAlbum(LocalAlbum a) async {
    _log.fine("Removing device album ${a.name}");
    try {
      // Asset deletion is handled in the repository
      await _localAlbumRepository.delete(a.id);
    } catch (e, s) {
      _log.warning("Error while removing device album", e, s);
    }
  }

  // The deviceAlbum is ignored since we are going to refresh it anyways
  FutureOr<bool> updateAlbum(LocalAlbum dbAlbum, LocalAlbum deviceAlbum) async {
    try {
      _log.fine("Syncing device album ${dbAlbum.name}");

      if (_albumsEqual(deviceAlbum, dbAlbum)) {
        _log.fine("Device album ${dbAlbum.name} has not changed. Skipping sync.");
        return false;
      }

      _log.fine("Device album ${dbAlbum.name} has changed. Syncing...");

      // Faster path - only new assets added
      if (await checkAddition(dbAlbum, deviceAlbum)) {
        _log.fine("Fast synced device album ${dbAlbum.name}");
        return true;
      }

      // Slower path - full sync
      return await fullDiff(dbAlbum, deviceAlbum);
    } catch (e, s) {
      _log.warning("Error while diff device album", e, s);
    }
    return true;
  }

  @visibleForTesting
  // The [deviceAlbum] is expected to be refreshed before calling this method
  // with modified time and asset count
  Future<bool> checkAddition(LocalAlbum dbAlbum, LocalAlbum deviceAlbum) async {
    try {
      _log.fine("Fast syncing device album ${dbAlbum.name}");
      // Assets has been modified
      if (deviceAlbum.assetCount <= dbAlbum.assetCount) {
        _log.fine("Local album has modifications. Proceeding to full sync");
        return false;
      }

      final updatedTime = (dbAlbum.updatedAt.millisecondsSinceEpoch ~/ 1000) + 1;
      final newAssetsCount = await _nativeSyncApi.getAssetsCountSince(deviceAlbum.id, updatedTime);

      // Early return if no new assets were found
      if (newAssetsCount == 0) {
        _log.fine("No new assets found despite album having changes. Proceeding to full sync for ${dbAlbum.name}");
        return false;
      }

      // Check whether there is only addition or if there has been deletions
      if (deviceAlbum.assetCount != dbAlbum.assetCount + newAssetsCount) {
        _log.fine("Local album has modifications. Proceeding to full sync");
        return false;
      }

      final newAssets = await _nativeSyncApi.getAssetsForAlbum(deviceAlbum.id, updatedTimeCond: updatedTime);

      await _localAlbumRepository.upsert(
        deviceAlbum.copyWith(backupSelection: dbAlbum.backupSelection),
        toUpsert: newAssets.toLocalAssets(),
      );

      return true;
    } catch (e, s) {
      _log.warning("Error on fast syncing local album: ${dbAlbum.name}", e, s);
    }
    return false;
  }

  @visibleForTesting
  // The [deviceAlbum] is expected to be refreshed before calling this method
  // with modified time and asset count
  Future<bool> fullDiff(LocalAlbum dbAlbum, LocalAlbum deviceAlbum) async {
    try {
      final assetsInDevice = deviceAlbum.assetCount > 0
          ? await _nativeSyncApi.getAssetsForAlbum(deviceAlbum.id).then((a) => a.toLocalAssets())
          : <LocalAsset>[];
      final assetsInDb = dbAlbum.assetCount > 0 ? await _localAlbumRepository.getAssets(dbAlbum.id) : <LocalAsset>[];

      if (deviceAlbum.assetCount == 0) {
        _log.fine("Device album ${deviceAlbum.name} is empty. Removing assets from DB.");
        await _localAlbumRepository.upsert(
          deviceAlbum.copyWith(backupSelection: dbAlbum.backupSelection),
          toDelete: assetsInDb.map((a) => a.id),
        );
        return true;
      }

      final updatedDeviceAlbum = deviceAlbum.copyWith(backupSelection: dbAlbum.backupSelection);

      if (dbAlbum.assetCount == 0) {
        _log.fine("Device album ${deviceAlbum.name} is empty. Adding assets to DB.");
        await _localAlbumRepository.upsert(updatedDeviceAlbum, toUpsert: assetsInDevice);
        return true;
      }

      assert(assetsInDb.isSortedBy((a) => a.id));
      assetsInDevice.sort((a, b) => a.id.compareTo(b.id));

      final assetsToUpsert = <LocalAsset>[];
      final assetsToDelete = <String>[];

      diffSortedListsSync(
        assetsInDb,
        assetsInDevice,
        compare: (a, b) => a.id.compareTo(b.id),
        both: (dbAsset, deviceAsset) {
          // Custom comparison to check if the asset has been modified without
          // comparing the checksum
          if (!_assetsEqual(dbAsset, deviceAsset)) {
            assetsToUpsert.add(deviceAsset);
            return true;
          }
          return false;
        },
        onlyFirst: (dbAsset) => assetsToDelete.add(dbAsset.id),
        onlySecond: (deviceAsset) => assetsToUpsert.add(deviceAsset),
      );

      _log.fine(
        "Syncing ${deviceAlbum.name}. ${assetsToUpsert.length} assets to add/update and ${assetsToDelete.length} assets to delete",
      );

      if (assetsToUpsert.isEmpty && assetsToDelete.isEmpty) {
        _log.fine("No asset changes detected in album ${deviceAlbum.name}. Updating metadata.");
        _localAlbumRepository.upsert(updatedDeviceAlbum);
        return true;
      }

      await _localAlbumRepository.upsert(updatedDeviceAlbum, toUpsert: assetsToUpsert, toDelete: assetsToDelete);

      return true;
    } catch (e, s) {
      _log.warning("Error on full syncing local album: ${dbAlbum.name}", e, s);
    }
    return true;
  }

  bool _assetsEqual(LocalAsset a, LocalAsset b) {
    return a.updatedAt.isAtSameMomentAs(b.updatedAt) &&
        a.createdAt.isAtSameMomentAs(b.createdAt) &&
        a.width == b.width &&
        a.height == b.height &&
        a.durationInSeconds == b.durationInSeconds;
  }

  bool _albumsEqual(LocalAlbum a, LocalAlbum b) {
    return a.name == b.name && a.assetCount == b.assetCount && a.updatedAt.isAtSameMomentAs(b.updatedAt);
  }
}

extension on Iterable<PlatformAlbum> {
  List<LocalAlbum> toLocalAlbums() {
    return map(
      (e) => LocalAlbum(
        id: e.id,
        name: e.name,
        updatedAt: tryFromSecondsSinceEpoch(e.updatedAt) ?? DateTime.now(),
        assetCount: e.assetCount,
      ),
    ).toList();
  }
}

extension on Iterable<PlatformAsset> {
  List<LocalAsset> toLocalAssets() {
    return map(
      (e) => LocalAsset(
        id: e.id,
        name: e.name,
        checksum: null,
        type: AssetType.values.elementAtOrNull(e.type) ?? AssetType.other,
        createdAt: tryFromSecondsSinceEpoch(e.createdAt) ?? DateTime.now(),
        updatedAt: tryFromSecondsSinceEpoch(e.updatedAt) ?? DateTime.now(),
        width: e.width,
        height: e.height,
        durationInSeconds: e.durationInSeconds,
        orientation: e.orientation,
        isFavorite: e.isFavorite,
      ),
    ).toList();
  }
}
