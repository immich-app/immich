import 'package:immich_mobile/domain/interfaces/album.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/album_etag.interface.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/database.interface.dart';
import 'package:immich_mobile/domain/interfaces/device_album.interface.dart';
import 'package:immich_mobile/domain/models/album.model.dart';
import 'package:immich_mobile/domain/models/album_etag.model.dart';
import 'package:immich_mobile/domain/services/asset_sync.service.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/collection_util.dart';
import 'package:immich_mobile/utils/isolate_helper.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';

class AlbumSyncService with LogMixin {
  const AlbumSyncService();

  Future<bool> performFullDeviceSyncIsolate() async {
    return await IsolateHelper.run(performFullDeviceSync);
  }

  Future<bool> performFullDeviceSync() async {
    try {
      final deviceAlbums = await di<IDeviceAlbumRepository>().getAll();
      final dbAlbums = await di<IAlbumRepository>().getAll(localOnly: true);
      final hasChange = await CollectionUtil.diffLists(
        dbAlbums,
        deviceAlbums,
        compare: Album.compareByLocalId,
        both: _syncDeviceAlbum,
        // Album is in DB but not anymore in device. Remove album and album specific assets
        onlyFirst: _removeDeviceAlbum,
        onlySecond: _addDeviceAlbum,
      );

      return hasChange;
    } catch (e, s) {
      log.e("Error performing full device sync", e, s);
    }
    return false;
  }

  Future<bool> _syncDeviceAlbum(
    Album dbAlbum,
    Album deviceAlbum, {
    DateTime? modifiedUntil,
  }) async {
    assert(dbAlbum.id != null, "Album ID from DB is null");
    final albumEtag =
        await di<IAlbumETagRepository>().get(dbAlbum.id!) ?? AlbumETag.empty();
    final assetCountInDevice =
        await di<IDeviceAlbumRepository>().getAssetCount(deviceAlbum.localId!);

    final albumNotUpdated = deviceAlbum.name == dbAlbum.name &&
        dbAlbum.modifiedTime.isAtSameMomentAs(deviceAlbum.modifiedTime) &&
        assetCountInDevice == albumEtag.assetCount;
    if (albumNotUpdated) {
      log.i("Device Album ${deviceAlbum.name} not updated. Skipping sync.");
      return false;
    }

    await _addDeviceAlbum(dbAlbum, modifiedUntil: modifiedUntil);
    return true;
  }

  Future<void> _addDeviceAlbum(Album album, {DateTime? modifiedUntil}) async {
    try {
      final albumId = (await di<IAlbumRepository>().upsert(album))?.id;
      // break fast if we cannot add an album
      if (albumId == null) {
        log.d("Failed creating device album. Skipped assets from album");
        return;
      }

      final assets = await di<HashService>().getHashedAssetsForAlbum(
        album.localId!,
        modifiedUntil: modifiedUntil,
      );

      await di<IDatabaseRepository>().txn(() async {
        final albumAssetsInDB =
            await di<IAlbumToAssetRepository>().getAssetsForAlbum(albumId);

        await di<AssetSyncService>().upsertAssetsToDb(
          assets,
          albumAssetsInDB,
          isRemoteSync: false,
        );

        // This is needed to get the updated assets for device album with valid db id field
        final albumAssets = await di<IAssetRepository>()
            .getForLocalIds(assets.map((a) => a.localId!));

        await di<IAlbumToAssetRepository>().addAssetIds(
          albumId,
          albumAssets.map((a) => a.id!),
        );
        await di<IAlbumRepository>().upsert(
          album.copyWith(thumbnailAssetId: albumAssets.firstOrNull?.id),
        );

        // Update ETag
        final albumETag = AlbumETag(
          albumId: albumId,
          assetCount: assets.length,
          modifiedTime: album.modifiedTime,
        );
        await di<IAlbumETagRepository>().upsert(albumETag);
      });
    } catch (e, s) {
      log.w("Error while adding device album", e, s);
    }
  }

  Future<void> _removeDeviceAlbum(Album album) async {
    assert(album.id != null, "Album ID from DB is null");
    final albumId = album.id!;
    try {
      await di<IDatabaseRepository>().txn(() async {
        final toRemove =
            await di<IAlbumToAssetRepository>().getAssetIdsOnlyInAlbum(albumId);
        await di<IAlbumRepository>().deleteId(albumId);
        await di<IAlbumToAssetRepository>().deleteAlbumId(albumId);
        await di<IAssetRepository>().deleteIds(toRemove);
      });
    } catch (e, s) {
      log.w("Error while removing device album", e, s);
    }
  }
}
