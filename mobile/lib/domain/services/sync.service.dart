import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart'
    hide AssetType;
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class SyncService {
  final IAlbumMediaRepository _albumMediaRepository;
  final ILocalAlbumRepository _localAlbumRepository;
  final ILocalAssetRepository _localAssetRepository;
  final ILocalAlbumAssetRepository _localAlbumAssetRepository;
  final Logger _log = Logger("SyncService");

  SyncService({
    required IAlbumMediaRepository albumMediaRepository,
    required ILocalAlbumRepository localAlbumRepository,
    required ILocalAssetRepository localAssetRepository,
    required ILocalAlbumAssetRepository localAlbumAssetRepository,
  })  : _albumMediaRepository = albumMediaRepository,
        _localAlbumRepository = localAlbumRepository,
        _localAssetRepository = localAssetRepository,
        _localAlbumAssetRepository = localAlbumAssetRepository;

  late final albumFilter = FilterOptionGroup(
    imageOption: const FilterOption(
      // needTitle is expected to be slow on iOS but is required to fetch the asset title
      needTitle: true,
      sizeConstraint: SizeConstraint(ignoreSize: true),
    ),
    videoOption: const FilterOption(
      needTitle: true,
      sizeConstraint: SizeConstraint(ignoreSize: true),
      durationConstraint: DurationConstraint(allowNullable: true),
    ),
    // This is needed to get the modified time of the album
    containsPathModified: true,
    createTimeCond: DateTimeCond.def().copyWith(ignore: true),
    updateTimeCond: DateTimeCond.def().copyWith(ignore: true),
    orders: const [
      // Always sort the result by createdDate.des to update the thumbnail
      OrderOption(type: OrderOptionType.createDate, asc: false),
    ],
  );

  Future<bool> syncLocalAlbums() async {
    try {
      final Stopwatch stopwatch = Stopwatch()..start();

      // Use an AdvancedCustomFilter to get all albums faster
      final filter = AdvancedCustomFilter(
        orderBy: [OrderByItem.asc(CustomColumns.base.id)],
      );
      final deviceAlbums = await _albumMediaRepository.getAll(filter: filter);
      final dbAlbums =
          await _localAlbumRepository.getAll(sortBy: SortLocalAlbumsBy.id);

      final hasChange = await diffSortedLists(
        dbAlbums,
        await Future.wait(
          deviceAlbums.map((a) => a.toDto(withAssetCount: false)),
        ),
        compare: (a, b) => a.id.compareTo(b.id),
        both: diffLocalAlbums,
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
      final deviceAlbum =
          await _albumMediaRepository.refresh(newAlbum.id, filter: albumFilter);

      final assets = newAlbum.assetCount > 0
          ? (await _albumMediaRepository.getAssetsForAlbum(deviceAlbum))
          : <LocalAsset>[];
      final album = (await deviceAlbum.toDto()).copyWith(
        // The below assumes the list is already sorted by createdDate from the filter
        thumbnailId: assets.firstOrNull?.localId,
      );

      await _localAlbumRepository.transaction(() async {
        if (newAlbum.assetCount > 0) {
          await _localAssetRepository.upsertAll(assets);
        }
        // Needs to be after asset upsert to link the thumbnail
        await _localAlbumRepository.upsert(album);

        if (newAlbum.assetCount > 0) {
          await _localAlbumAssetRepository.linkAssetsToAlbum(
            album.id,
            assets.map((a) => a.localId),
          );
        }
      });
    } catch (e, s) {
      _log.warning("Error while adding device album", e, s);
    }
  }

  Future<void> removeLocalAlbum(LocalAlbum a) async {
    _log.info("Removing device album ${a.name}");
    try {
      // Do not request title to speed things up on iOS
      final filter = albumFilter;
      filter.setOption(
        AssetType.image,
        filter.getOption(AssetType.image).copyWith(needTitle: false),
      );
      filter.setOption(
        AssetType.video,
        filter.getOption(AssetType.video).copyWith(needTitle: false),
      );
      final deviceAlbum =
          await _albumMediaRepository.refresh(a.id, filter: filter);
      final assetsToDelete =
          (await _localAlbumAssetRepository.getAssetsForAlbum(deviceAlbum.id))
              .map((asset) => asset.localId)
              .toSet();

      // Remove all assets that are only in this particular album
      // We cannot remove all assets in the album because they might be in other albums in iOS
      final assetsOnlyInAlbum = assetsToDelete.isEmpty
          ? <String>{}
          : (await _localAlbumRepository.getAssetIdsOnlyInAlbum(deviceAlbum.id))
              .toSet();
      await _localAlbumRepository.transaction(() async {
        // Delete all assets that are only in this particular album
        await _localAssetRepository.deleteIds(
          assetsToDelete.intersection(assetsOnlyInAlbum),
        );
        // Unlink the others
        await _localAlbumAssetRepository.unlinkAssetsFromAlbum(
          deviceAlbum.id,
          assetsToDelete.difference(assetsOnlyInAlbum),
        );
        await _localAlbumRepository.delete(deviceAlbum.id);
      });
    } catch (e, s) {
      _log.warning("Error while removing device album", e, s);
    }
  }

  @visibleForTesting
  // The deviceAlbum is ignored since we are going to refresh it anyways
  FutureOr<bool> diffLocalAlbums(LocalAlbum dbAlbum, LocalAlbum _) async {
    try {
      _log.info("Syncing device album ${dbAlbum.name}");

      final albumEntity =
          await _albumMediaRepository.refresh(dbAlbum.id, filter: albumFilter);
      final deviceAlbum = await albumEntity.toDto();

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
        await _localAlbumRepository.upsert(
          deviceAlbum.copyWith(backupSelection: dbAlbum.backupSelection),
        );
        _log.info("Album ${dbAlbum.name} is empty. Only metadata updated.");
        return true;
      }

      _log.info("Device album ${dbAlbum.name} has changed. Syncing...");

      // Handle the case where assets are only added - fast path
      if (await handleOnlyAssetsAdded(dbAlbum, deviceAlbum)) {
        _log.info("Fast synced device album ${dbAlbum.name}");
        return true;
      }

      // Slower path - full sync
      return await handleAssetUpdate(dbAlbum, deviceAlbum, albumEntity);
    } catch (e, s) {
      _log.warning("Error while diff device album", e, s);
    }
    return true;
  }

  @visibleForTesting
  Future<bool> handleOnlyAssetsAdded(
    LocalAlbum dbAlbum,
    LocalAlbum deviceAlbum,
  ) async {
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
      final filter = albumFilter.copyWith(
        updateTimeCond: DateTimeCond(
          min: dbAlbum.updatedAt.add(const Duration(seconds: 1)),
          max: deviceAlbum.updatedAt,
        ),
      );
      final modifiedAlbum =
          await _albumMediaRepository.refresh(deviceAlbum.id, filter: filter);
      final newAssets =
          await _albumMediaRepository.getAssetsForAlbum(modifiedAlbum);

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

      await _localAlbumRepository.transaction(() async {
        await _localAssetRepository.upsertAll(newAssets);
        await _localAlbumAssetRepository.linkAssetsToAlbum(
          deviceAlbum.id,
          newAssets.map(((a) => a.localId)),
        );
        await _localAlbumRepository.upsert(
          deviceAlbum.copyWith(
            thumbnailId: thumbnailId,
            backupSelection: dbAlbum.backupSelection,
          ),
        );
      });

      return true;
    } catch (e, s) {
      _log.warning("Error on fast syncing local album: ${dbAlbum.name}", e, s);
    }
    return false;
  }

  @visibleForTesting
  Future<bool> handleAssetUpdate(
    LocalAlbum dbAlbum,
    LocalAlbum deviceAlbum,
    AssetPathEntity deviceAlbumEntity,
  ) async {
    try {
      final assetsInDevice = deviceAlbum.assetCount > 0
          ? await _albumMediaRepository.getAssetsForAlbum(deviceAlbumEntity)
          : <LocalAsset>[];

      final assetsInDb = dbAlbum.assetCount > 0
          ? await _localAlbumAssetRepository.getAssetsForAlbum(dbAlbum.id)
          : <LocalAsset>[];

      // The below assumes the list is already sorted by createdDate from the filter
      String? thumbnailId =
          assetsInDevice.firstOrNull?.localId ?? dbAlbum.thumbnailId;

      final assetsToAdd = <LocalAsset>{},
          assetsToUpsert = <LocalAsset>{},
          assetsToDelete = <String>{};
      if (deviceAlbum.assetCount == 0) {
        assetsToDelete.addAll(assetsInDb.map((asset) => asset.localId));
        thumbnailId = null;
      } else if (dbAlbum.assetCount == 0) {
        assetsToAdd.addAll(assetsInDevice);
      } else {
        assetsInDb.sort((a, b) => a.localId.compareTo(b.localId));
        assetsInDevice.sort((a, b) => a.localId.compareTo(b.localId));
        diffSortedListsSync(
          assetsInDb,
          assetsInDevice,
          compare: (a, b) => a.localId.compareTo(b.localId),
          both: (dbAsset, deviceAsset) {
            if (dbAsset == deviceAsset) {
              return false;
            }
            assetsToUpsert.add(deviceAsset);
            return true;
          },
          onlyFirst: (dbAsset) => assetsToDelete.add(dbAsset.localId),
          onlySecond: (deviceAsset) => assetsToAdd.add(deviceAsset),
        );
      }
      _log.info(
        "Syncing ${deviceAlbum.name}. ${assetsToAdd.length} assets to add, ${assetsToUpsert.length} assets to update and ${assetsToDelete.length} assets to delete",
      );

      // Populate the album meta
      final updatedAlbum = deviceAlbum.copyWith(
        thumbnailId: thumbnailId,
        backupSelection: dbAlbum.backupSelection,
      );

      // Remove all assets that are only in this particular album
      // We cannot remove all assets in the album because they might be in other albums in iOS
      final assetsOnlyInAlbum = assetsToDelete.isEmpty
          ? <String>{}
          : (await _localAlbumRepository.getAssetIdsOnlyInAlbum(deviceAlbum.id))
              .toSet();

      await _localAlbumRepository.transaction(() async {
        await _localAssetRepository
            .upsertAll(assetsToAdd.followedBy(assetsToUpsert));
        await _localAlbumAssetRepository.linkAssetsToAlbum(
          dbAlbum.id,
          assetsToAdd.map((a) => a.localId),
        );
        await _localAlbumRepository.upsert(updatedAlbum);
        // Delete all assets that are only in this particular album
        await _localAssetRepository.deleteIds(
          assetsToDelete.intersection(assetsOnlyInAlbum),
        );
        // Unlink the others
        await _localAlbumAssetRepository.unlinkAssetsFromAlbum(
          dbAlbum.id,
          assetsToDelete.difference(assetsOnlyInAlbum),
        );
      });
    } catch (e, s) {
      _log.warning("Error on full syncing local album: ${dbAlbum.name}", e, s);
    }
    return true;
  }
}

extension AssetPathEntitySyncX on AssetPathEntity {
  Future<LocalAlbum> toDto({bool withAssetCount = true}) async => LocalAlbum(
        id: id,
        name: name,
        updatedAt: lastModified ?? DateTime.now(),
        // the assetCountAsync call is expensive for larger albums with several thousand assets
        assetCount: withAssetCount ? await assetCountAsync : 0,
        backupSelection: BackupSelection.none,
        isAll: isAll,
      );
}
