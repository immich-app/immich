import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:immich_mobile/utils/nullable_value.dart';
import 'package:logging/logging.dart';

class SyncService {
  final IAlbumMediaRepository _albumMediaRepository;
  final ILocalAlbumRepository _localAlbumRepository;
  final ILocalAssetRepository _localAssetRepository;
  final Logger _log = Logger("SyncService");

  SyncService({
    required IAlbumMediaRepository albumMediaRepository,
    required ILocalAlbumRepository localAlbumRepository,
    required ILocalAssetRepository localAssetRepository,
  })  : _albumMediaRepository = albumMediaRepository,
        _localAlbumRepository = localAlbumRepository,
        _localAssetRepository = localAssetRepository;

  Future<bool> syncLocalAlbums() async {
    try {
      final Stopwatch stopwatch = Stopwatch()..start();
      // The deviceAlbums will not have the updatedAt field
      // and the assetCount will be 0. They are refreshed later
      // after the comparison
      final deviceAlbums =
          (await _albumMediaRepository.getAll()).sortedBy((a) => a.id);
      final dbAlbums =
          await _localAlbumRepository.getAll(sortBy: SortLocalAlbumsBy.id);

      final hasChange = await diffSortedLists(
        dbAlbums,
        deviceAlbums,
        compare: (a, b) => a.id.compareTo(b.id),
        both: syncLocalAlbum,
        onlyFirst: removeLocalAlbum,
        onlySecond: addLocalAlbum,
      );

      stopwatch.stop();
      _log.info("Full device sync took - ${stopwatch.elapsedMilliseconds}ms");
      return hasChange;
    } catch (e, s) {
      _log.severe("Error performing full device sync", e, s);
    }
    return false;
  }

  Future<void> addLocalAlbum(LocalAlbum newAlbum) async {
    try {
      _log.info("Adding device album ${newAlbum.name}");
      final deviceAlbum = await _albumMediaRepository.refresh(
        newAlbum.id,
        withModifiedTime: true,
        withAssetCount: true,
      );

      final assets = deviceAlbum.assetCount > 0
          ? (await _albumMediaRepository.getAssetsForAlbum(deviceAlbum.id))
          : <LocalAsset>[];

      final album = deviceAlbum.copyWith(
        // The below assumes the list is already sorted by createdDate from the filter
        thumbnailId: NullableValue.valueOrEmpty(assets.firstOrNull?.localId),
      );

      await _localAlbumRepository.insert(album, assets);
      _log.info("Successfully added device album ${album.name}");
    } catch (e, s) {
      _log.warning("Error while adding device album", e, s);
    }
  }

  Future<void> removeLocalAlbum(LocalAlbum a) async {
    _log.info("Removing device album ${a.name}");
    try {
      // Asset deletion is handled in the repository
      await _localAlbumRepository.delete(a.id);
    } catch (e, s) {
      _log.warning("Error while removing device album", e, s);
    }
  }

  // The deviceAlbum is ignored since we are going to refresh it anyways
  FutureOr<bool> syncLocalAlbum(LocalAlbum dbAlbum, LocalAlbum _) async {
    try {
      _log.info("Syncing device album ${dbAlbum.name}");

      final deviceAlbum = await _albumMediaRepository.refresh(
        dbAlbum.id,
        withModifiedTime: true,
        withAssetCount: true,
      );

      // Early return if album hasn't changed
      if (deviceAlbum.updatedAt.isAtSameMomentAs(dbAlbum.updatedAt) &&
          deviceAlbum.assetCount == dbAlbum.assetCount) {
        _log.info(
          "Device album ${dbAlbum.name} has not changed. Skipping sync.",
        );
        return false;
      }

      // Skip empty albums that don't need syncing
      if (deviceAlbum.assetCount == 0 && dbAlbum.assetCount == 0) {
        await _localAlbumRepository.update(
          deviceAlbum.copyWith(backupSelection: dbAlbum.backupSelection),
        );
        _log.info("Album ${dbAlbum.name} is empty. Only metadata updated.");
        return true;
      }

      _log.info("Device album ${dbAlbum.name} has changed. Syncing...");

      // Faster path - only assets added
      if (await tryFastSync(dbAlbum, deviceAlbum)) {
        _log.info("Fast synced device album ${dbAlbum.name}");
        return true;
      }

      // Slower path - full sync
      return await fullSync(dbAlbum, deviceAlbum);
    } catch (e, s) {
      _log.warning("Error while diff device album", e, s);
    }
    return true;
  }

  @visibleForTesting
  // The [deviceAlbum] is expected to be refreshed before calling this method
  // with modified time and asset count
  Future<bool> tryFastSync(LocalAlbum dbAlbum, LocalAlbum deviceAlbum) async {
    try {
      _log.info("Fast syncing device album ${dbAlbum.name}");
      if (!deviceAlbum.updatedAt.isAfter(dbAlbum.updatedAt)) {
        _log.info(
          "Local album ${deviceAlbum.name} has modifications. Proceeding to full sync",
        );
        return false;
      }

      // Assets has been modified
      if (deviceAlbum.assetCount <= dbAlbum.assetCount) {
        _log.info("Local album has modifications. Proceeding to full sync");
        return false;
      }

      // Get all assets that are modified after the last known modifiedTime
      final newAssets = await _albumMediaRepository.getAssetsForAlbum(
        deviceAlbum.id,
        updateTimeCond: DateTimeFilter(
          min: dbAlbum.updatedAt.add(const Duration(seconds: 1)),
          max: deviceAlbum.updatedAt,
        ),
      );

      // Early return if no new assets were found
      if (newAssets.isEmpty) {
        _log.info(
          "No new assets found despite album changes. Proceeding to full sync for ${dbAlbum.name}",
        );
        return false;
      }

      // Check whether there is only addition or if there has been deletions
      if (deviceAlbum.assetCount != dbAlbum.assetCount + newAssets.length) {
        _log.info("Local album has modifications. Proceeding to full sync");
        return false;
      }

      String? thumbnailId = dbAlbum.thumbnailId;
      if (thumbnailId == null || newAssets.isNotEmpty) {
        if (thumbnailId == null) {
          thumbnailId = newAssets.firstOrNull?.localId;
        } else if (newAssets.isNotEmpty) {
          // The below assumes the list is already sorted by createdDate from the filter
          final oldThumbAsset = await _localAssetRepository.get(thumbnailId);
          if (oldThumbAsset.createdAt
              .isBefore(newAssets.firstOrNull!.createdAt)) {
            thumbnailId = newAssets.firstOrNull?.localId;
          }
        }
      }

      await _handleUpdate(
        deviceAlbum.copyWith(
          thumbnailId: NullableValue.valueOrEmpty(thumbnailId),
          backupSelection: dbAlbum.backupSelection,
        ),
        assetsToUpsert: newAssets,
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
  Future<bool> fullSync(LocalAlbum dbAlbum, LocalAlbum deviceAlbum) async {
    try {
      final assetsInDevice = deviceAlbum.assetCount > 0
          ? await _albumMediaRepository.getAssetsForAlbum(deviceAlbum.id)
          : <LocalAsset>[];
      final assetsInDb = dbAlbum.assetCount > 0
          ? await _localAlbumRepository.getAssetsForAlbum(dbAlbum.id)
          : <LocalAsset>[];

      if (deviceAlbum.assetCount == 0) {
        _log.fine(
          "Device album ${deviceAlbum.name} is empty. Removing assets from DB.",
        );
        await _handleUpdate(
          deviceAlbum.copyWith(
            // Clear thumbnail for empty album
            thumbnailId: const NullableValue.empty(),
            backupSelection: dbAlbum.backupSelection,
          ),
          assetIdsToDelete: assetsInDb.map((a) => a.localId),
        );
        return true;
      }

      // The below assumes the list is already sorted by createdDate from the filter
      String? thumbnailId = assetsInDevice.isNotEmpty
          ? assetsInDevice.firstOrNull?.localId
          : dbAlbum.thumbnailId;

      final updatedDeviceAlbum = deviceAlbum.copyWith(
        thumbnailId: NullableValue.valueOrEmpty(thumbnailId),
        backupSelection: dbAlbum.backupSelection,
      );

      if (dbAlbum.assetCount == 0) {
        _log.fine(
          "Device album ${deviceAlbum.name} is empty. Adding assets to DB.",
        );
        await _handleUpdate(updatedDeviceAlbum, assetsToUpsert: assetsInDevice);
        return true;
      }

      // Sort assets by localId for the diffSortedLists function
      assetsInDb.sort((a, b) => a.localId.compareTo(b.localId));
      assetsInDevice.sort((a, b) => a.localId.compareTo(b.localId));

      final assetsToAddOrUpdate = <LocalAsset>[];
      final assetIdsToDelete = <String>[];

      diffSortedListsSync(
        assetsInDb,
        assetsInDevice,
        compare: (a, b) => a.localId.compareTo(b.localId),
        both: (dbAsset, deviceAsset) {
          if (!_assetsEqual(dbAsset, deviceAsset)) {
            assetsToAddOrUpdate.add(deviceAsset);
            return true;
          }
          return false;
        },
        onlyFirst: (dbAsset) => assetIdsToDelete.add(dbAsset.localId),
        onlySecond: (deviceAsset) => assetsToAddOrUpdate.add(deviceAsset),
      );

      _log.info(
        "Syncing ${deviceAlbum.name}. ${assetsToAddOrUpdate.length} assets to add/update and ${assetIdsToDelete.length} assets to delete",
      );

      if (assetsToAddOrUpdate.isEmpty && assetIdsToDelete.isEmpty) {
        _log.fine(
          "No asset changes detected in album ${deviceAlbum.name}. Updating metadata.",
        );
        _localAlbumRepository.update(updatedDeviceAlbum);
        return true;
      }

      await _handleUpdate(
        updatedDeviceAlbum,
        assetsToUpsert: assetsToAddOrUpdate,
        assetIdsToDelete: assetIdsToDelete,
      );

      return true;
    } catch (e, s) {
      _log.warning("Error on full syncing local album: ${dbAlbum.name}", e, s);
    }
    return false;
  }

  Future<void> _handleUpdate(
    LocalAlbum album, {
    Iterable<LocalAsset>? assetsToUpsert,
    Iterable<String>? assetIdsToDelete,
  }) =>
      _localAlbumRepository.transaction(() async {
        if (assetsToUpsert != null && assetsToUpsert.isNotEmpty) {
          await _localAlbumRepository.addAssets(album.id, assetsToUpsert);
        }

        await _localAlbumRepository.update(album);

        if (assetIdsToDelete != null && assetIdsToDelete.isNotEmpty) {
          await _localAlbumRepository.removeAssets(
            album.id,
            assetIdsToDelete,
          );
        }
      });

  // Helper method to check if assets are equal without relying on the checksum
  bool _assetsEqual(LocalAsset a, LocalAsset b) {
    return a.updatedAt.isAtSameMomentAs(b.updatedAt) &&
        a.createdAt.isAtSameMomentAs(b.createdAt) &&
        a.width == b.width &&
        a.height == b.height &&
        a.durationInSeconds == b.durationInSeconds;
  }
}
