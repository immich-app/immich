import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/platform/messages.g.dart' as platform;
import 'package:immich_mobile/utils/diff.dart';
import 'package:logging/logging.dart';
import 'package:platform/platform.dart';

class DeviceSyncService {
  final IAlbumMediaRepository _albumMediaRepository;
  final ILocalAlbumRepository _localAlbumRepository;
  final Platform _platform;
  final platform.ImHostService _hostService;
  final Logger _log = Logger("SyncService");

  DeviceSyncService({
    required IAlbumMediaRepository albumMediaRepository,
    required ILocalAlbumRepository localAlbumRepository,
    required platform.ImHostService hostService,
    Platform? platform,
  })  : _albumMediaRepository = albumMediaRepository,
        _localAlbumRepository = localAlbumRepository,
        _platform = platform ?? const LocalPlatform(),
        _hostService = hostService;

  Future<void> sync() async {
    try {
      if (await _hostService.shouldFullSync()) {
        _log.fine("Cannot use partial sync. Performing full sync");
        return await fullSync();
      }

      final delta = await _hostService.getMediaChanges();
      if (!delta.hasChanges) {
        _log.fine("No media changes detected. Skipping sync");
        return;
      }

      final deviceAlbums = await _albumMediaRepository.getAll();
      await _localAlbumRepository.updateAll(deviceAlbums);
      await _localAlbumRepository.processDelta(delta);

      if (_platform.isAndroid) {
        final dbAlbums = await _localAlbumRepository.getAll();
        for (final album in dbAlbums) {
          final deviceIds = await _hostService.getAssetIdsForAlbum(album.id);
          await _localAlbumRepository.syncAlbumDeletes(album.id, deviceIds);
        }
      }

      await _hostService.checkpointSync();
    } catch (e, s) {
      _log.severe("Error performing device sync", e, s);
    }
  }

  Future<void> fullSync() async {
    try {
      final Stopwatch stopwatch = Stopwatch()..start();
      // The deviceAlbums will not have the updatedAt field
      // and the assetCount will be 0. They are refreshed later
      // after the comparison. The orderby in the filter sorts the assets
      // and not the albums.
      final deviceAlbums =
          (await _albumMediaRepository.getAll()).sortedBy((a) => a.id);

      final dbAlbums =
          await _localAlbumRepository.getAll(sortBy: SortLocalAlbumsBy.id);

      await diffSortedLists(
        dbAlbums,
        deviceAlbums,
        compare: (a, b) => a.id.compareTo(b.id),
        both: updateAlbum,
        onlyFirst: removeAlbum,
        onlySecond: addAlbum,
      );

      await _hostService.checkpointSync();
      stopwatch.stop();
      _log.info("Full device sync took - ${stopwatch.elapsedMilliseconds}ms");
    } catch (e, s) {
      _log.severe("Error performing full device sync", e, s);
    }
  }

  Future<void> addAlbum(LocalAlbum newAlbum) async {
    try {
      _log.info("Adding device album ${newAlbum.name}");
      final album = await _albumMediaRepository.refresh(newAlbum.id);

      final assets = album.assetCount > 0
          ? await _albumMediaRepository.getAssetsForAlbum(album.id)
          : <LocalAsset>[];

      await _localAlbumRepository.upsert(album, toUpsert: assets);
      _log.fine("Successfully added device album ${album.name}");
    } catch (e, s) {
      _log.warning("Error while adding device album", e, s);
    }
  }

  Future<void> removeAlbum(LocalAlbum a) async {
    _log.info("Removing device album ${a.name}");
    try {
      // Asset deletion is handled in the repository
      await _localAlbumRepository.delete(a.id);
    } catch (e, s) {
      _log.warning("Error while removing device album", e, s);
    }
  }

  // The deviceAlbum is ignored since we are going to refresh it anyways
  FutureOr<bool> updateAlbum(LocalAlbum dbAlbum, LocalAlbum _) async {
    try {
      _log.info("Syncing device album ${dbAlbum.name}");

      final deviceAlbum = await _albumMediaRepository.refresh(dbAlbum.id);

      // Early return if album hasn't changed
      if (deviceAlbum.updatedAt.isAtSameMomentAs(dbAlbum.updatedAt) &&
          deviceAlbum.assetCount == dbAlbum.assetCount) {
        _log.fine(
          "Device album ${dbAlbum.name} has not changed. Skipping sync.",
        );
        return false;
      }

      _log.info("Device album ${dbAlbum.name} has changed. Syncing...");

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
  Future<bool> checkAddition(
    LocalAlbum dbAlbum,
    LocalAlbum deviceAlbum,
  ) async {
    try {
      _log.fine("Fast syncing device album ${dbAlbum.name}");
      // Assets has been modified
      if (deviceAlbum.assetCount <= dbAlbum.assetCount) {
        _log.fine("Local album has modifications. Proceeding to full sync");
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
        _log.fine(
          "No new assets found despite album having changes. Proceeding to full sync for ${dbAlbum.name}",
        );
        return false;
      }

      // Check whether there is only addition or if there has been deletions
      if (deviceAlbum.assetCount != dbAlbum.assetCount + newAssets.length) {
        _log.fine("Local album has modifications. Proceeding to full sync");
        return false;
      }

      await _localAlbumRepository.upsert(
        deviceAlbum.copyWith(backupSelection: dbAlbum.backupSelection),
        toUpsert: newAssets,
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
          ? await _albumMediaRepository.getAssetsForAlbum(deviceAlbum.id)
          : <LocalAsset>[];
      final assetsInDb = dbAlbum.assetCount > 0
          ? await _localAlbumRepository.getAssetsForAlbum(dbAlbum.id)
          : <LocalAsset>[];

      if (deviceAlbum.assetCount == 0) {
        _log.fine(
          "Device album ${deviceAlbum.name} is empty. Removing assets from DB.",
        );
        await _localAlbumRepository.upsert(
          deviceAlbum.copyWith(backupSelection: dbAlbum.backupSelection),
          toDelete: assetsInDb.map((a) => a.id),
        );
        return true;
      }

      final updatedDeviceAlbum = deviceAlbum.copyWith(
        backupSelection: dbAlbum.backupSelection,
      );

      if (dbAlbum.assetCount == 0) {
        _log.fine(
          "Device album ${deviceAlbum.name} is empty. Adding assets to DB.",
        );
        await _localAlbumRepository.upsert(
          updatedDeviceAlbum,
          toUpsert: assetsInDevice,
        );
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
        _log.fine(
          "No asset changes detected in album ${deviceAlbum.name}. Updating metadata.",
        );
        _localAlbumRepository.upsert(updatedDeviceAlbum);
        return true;
      }

      await _localAlbumRepository.upsert(
        updatedDeviceAlbum,
        toUpsert: assetsToUpsert,
        toDelete: assetsToDelete,
      );

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
}
