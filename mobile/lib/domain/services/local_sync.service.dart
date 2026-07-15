import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/utils/datetime_helpers.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:logging/logging.dart';

const String _kSyncCancelledCode = "SYNC_CANCELLED";

class LocalSyncService {
  final DriftLocalAlbumRepository _localAlbumRepository;
  // ignore: unused_field
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftTrashSyncRepository _trashSyncRepository;
  final NativeSyncApi _nativeSyncApi;
  final Completer<void>? _cancellation;
  final Logger _log = Logger("DeviceSyncService");

  LocalSyncService({
    required this._localAlbumRepository,
    required this._localAssetRepository,
    required this._trashSyncRepository,
    required this._nativeSyncApi,
    this._cancellation,
  }) {
    _cancellation?.future.then((_) => _nativeSyncApi.cancelSync().onError(_log.warning));
  }

  bool get _isCancelled => _cancellation?.isCompleted ?? false;

  Future<void> sync({bool full = false}) async {
    final Stopwatch stopwatch = Stopwatch()..start();
    try {
      if (CurrentPlatform.isIOS) {
        // final assets = await _localAssetRepository.getEmptyCloudIdAssets();
        // await _mapIosCloudIds(assets);
      }

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
      final newAssets = delta.updates.toLocalAssets();
      await _localAlbumRepository.processDelta(
        updates: newAssets,
        deletes: delta.deletes,
        assetAlbums: delta.assetAlbums,
      );

      final dbAlbums = await _localAlbumRepository.getAll();
      // On Android, we need to sync all albums since it is not possible to
      // detect album deletions from the native side
      if (CurrentPlatform.isAndroid) {
        for (final album in dbAlbums) {
          if (_isCancelled) {
            _log.warning("Local sync cancelled. Stopped processing albums.");
            return;
          }
          final deviceIds = await _nativeSyncApi.getAssetIdsForAlbum(album.id);
          await _localAlbumRepository.syncDeletes(album.id, deviceIds);
        }
      }

      if (CurrentPlatform.isIOS) {
        // On iOS, we need to full sync albums that are marked as cloud as the delta sync
        // does not include changes for cloud albums.
        final cloudAlbums = deviceAlbums.where((a) => a.isCloud).toLocalAlbums();
        for (final album in cloudAlbums) {
          if (_isCancelled) {
            _log.warning("Local sync cancelled. Stopped processing cloud albums.");
            return;
          }
          final dbAlbum = dbAlbums.firstWhereOrNull((a) => a.id == album.id);
          if (dbAlbum == null) {
            _log.warning("Cloud album ${album.name} not found in local database. Skipping sync.");
            continue;
          }
          await updateAlbum(dbAlbum, album);
        }

        await _mapIosCloudIds(newAssets);
      }
      await _nativeSyncApi.checkpointSync();
      await _trashSyncRepository.restoreChecksums();
    } on PlatformException catch (e, s) {
      if (e.code == _kSyncCancelledCode) {
        _log.warning("Local sync cancelled");
      } else {
        _log.severe("Error performing device sync", e, s);
      }
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
      await _trashSyncRepository.restoreChecksums();
      stopwatch.stop();
      _log.info("Full device sync took - ${stopwatch.elapsedMilliseconds}ms");
    } on PlatformException catch (e, s) {
      if (e.code == _kSyncCancelledCode) {
        _log.warning("Full device sync cancelled");
      } else {
        _log.severe("Error performing full device sync", e, s);
      }
    } catch (e, s) {
      _log.severe("Error performing full device sync", e, s);
    }
  }

  Future<void> addAlbum(LocalAlbum album) async {
    if (_isCancelled) {
      return;
    }
    try {
      _log.fine("Adding device album ${album.name}");

      final assets = album.assetCount > 0
          ? await _nativeSyncApi.getAssetsForAlbum(album.id).then((a) => a.toLocalAssets())
          : <LocalAsset>[];

      await _localAlbumRepository.upsert(album, toUpsert: assets);
      await _mapIosCloudIds(assets);
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
    if (_isCancelled) {
      return false;
    }
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

      final newAssets = await _nativeSyncApi
          .getAssetsForAlbum(deviceAlbum.id, updatedTimeCond: updatedTime)
          .then((a) => a.toLocalAssets());

      await _localAlbumRepository.upsert(
        deviceAlbum.copyWith(backupSelection: dbAlbum.backupSelection),
        toUpsert: newAssets,
      );

      await _mapIosCloudIds(newAssets);
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
        await _mapIosCloudIds(assetsInDevice);
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
        await _localAlbumRepository.upsert(updatedDeviceAlbum);
        return true;
      }

      await _localAlbumRepository.upsert(updatedDeviceAlbum, toUpsert: assetsToUpsert, toDelete: assetsToDelete);
      await _mapIosCloudIds(assetsToUpsert);

      return true;
    } catch (e, s) {
      _log.warning("Error on full syncing local album: ${dbAlbum.name}", e, s);
    }
    return true;
  }

  // ignore: avoid-unused-parameters
  Future<void> _mapIosCloudIds(List<LocalAsset> assets) async {
    // if (!CurrentPlatform.isIOS || assets.isEmpty) {
    return;
    // }

    // final assetIds = assets.map((a) => a.id).toList();
    // final cloudMapping = <String, String>{};
    // final cloudIds = await _nativeSyncApi.getCloudIdForAssetIds(assetIds);
    // for (int i = 0; i < cloudIds.length; i++) {
    //   final cloudIdResult = cloudIds[i];
    //   if (cloudIdResult.cloudId != null) {
    //     cloudMapping[cloudIdResult.assetId] = cloudIdResult.cloudId!;
    //   } else {
    //     final asset = assets.firstWhereOrNull((a) => a.id == cloudIdResult.assetId);
    //     _log.fine(
    //       "Cannot fetch cloudId for asset with id: ${cloudIdResult.assetId}, name: ${asset?.name}, createdAt: ${asset?.createdAt}. Error: ${cloudIdResult.error ?? "unknown"}",
    //     );
    //   }
    // }

    // await _localAlbumRepository.updateCloudMapping(cloudMapping);
  }

  bool _assetsEqual(LocalAsset a, LocalAsset b) {
    if (CurrentPlatform.isAndroid) {
      return a.updatedAt.isAtSameMomentAs(b.updatedAt) &&
          a.createdAt.isAtSameMomentAs(b.createdAt) &&
          a.width == b.width &&
          a.height == b.height &&
          a.durationMs == b.durationMs;
    }

    final firstAdjustment = a.adjustmentTime?.millisecondsSinceEpoch ?? 0;
    final secondAdjustment = b.adjustmentTime?.millisecondsSinceEpoch ?? 0;
    return firstAdjustment == secondAdjustment &&
        a.createdAt.isAtSameMomentAs(b.createdAt) &&
        a.width == b.width &&
        a.height == b.height &&
        a.durationMs == b.durationMs &&
        a.latitude == b.latitude &&
        a.longitude == b.longitude;
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
        updatedAt: tryFromSecondsSinceEpoch(e.updatedAt, isUtc: true) ?? DateTime.timestamp(),
        assetCount: e.assetCount,
        isIosSharedAlbum: e.isCloud,
      ),
    ).toList();
  }
}

extension on Iterable<PlatformAsset> {
  List<LocalAsset> toLocalAssets() {
    return map((e) => e.toLocalAsset()).toList();
  }
}

extension PlatformToLocalAsset on PlatformAsset {
  LocalAsset toLocalAsset() => LocalAsset(
    id: id,
    name: name,
    checksum: null,
    type: AssetType.values.elementAtOrNull(type) ?? AssetType.other,
    createdAt: tryFromSecondsSinceEpoch(createdAt, isUtc: true) ?? DateTime.timestamp(),
    updatedAt: tryFromSecondsSinceEpoch(updatedAt, isUtc: true) ?? DateTime.timestamp(),
    width: width,
    height: height,
    durationMs: durationMs,
    isFavorite: isFavorite,
    orientation: orientation,
    playbackStyle: _toPlaybackStyle(playbackStyle),
    adjustmentTime: tryFromSecondsSinceEpoch(adjustmentTime, isUtc: true),
    latitude: latitude,
    longitude: longitude,
    isEdited: false,
  );
}

AssetPlaybackStyle _toPlaybackStyle(PlatformAssetPlaybackStyle style) => switch (style) {
  PlatformAssetPlaybackStyle.unknown => AssetPlaybackStyle.unknown,
  PlatformAssetPlaybackStyle.image => AssetPlaybackStyle.image,
  PlatformAssetPlaybackStyle.video => AssetPlaybackStyle.video,
  PlatformAssetPlaybackStyle.imageAnimated => AssetPlaybackStyle.imageAnimated,
  PlatformAssetPlaybackStyle.livePhoto => AssetPlaybackStyle.livePhoto,
  PlatformAssetPlaybackStyle.videoLooping => AssetPlaybackStyle.videoLooping,
};
