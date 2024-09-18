import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/media.interface.dart';
import 'package:photo_manager/photo_manager.dart' hide AssetType;

final mediaRepositoryProvider = Provider((ref) => MediaRepository());

class MediaRepository implements IMediaRepository {
  @override
  Future<List<Album>> getAllAlbums() async {
    final List<AssetPathEntity> assetPathEntities =
        await PhotoManager.getAssetPathList(
      hasAll: true,
      filterOption: FilterOptionGroup(containsPathModified: true),
    );
    return assetPathEntities.map(_toAlbum).toList();
  }

  @override
  Future<List<String>> getAssetIdsByAlbumId(String albumId) async {
    final onDevice = await AssetPathEntity.fromId(albumId);
    final List<AssetEntity> assets =
        await onDevice.getAssetListRange(start: 0, end: 0x7fffffffffffffff);
    return assets.map((e) => e.id).toList();
  }

  @override
  Future<int> countAssetsInAlbum(String albumId) async {
    final album = await AssetPathEntity.fromId(albumId);
    return album.assetCountAsync;
  }

  @override
  Future<List<Asset>> getAssetsByAlbumId(
    String albumId, {
    int start = 0,
    int end = 0x7fffffffffffffff,
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
    bool orderByModificationDate = false,
  }) async {
    final onDevice = await AssetPathEntity.fromId(
      albumId,
      filterOption: FilterOptionGroup(
        containsPathModified: true,
        orders: orderByModificationDate
            ? [const OrderOption(type: OrderOptionType.updateDate)]
            : [],
        imageOption: const FilterOption(needTitle: true),
        videoOption: const FilterOption(needTitle: true),
        updateTimeCond: modifiedFrom == null && modifiedUntil == null
            ? null
            : DateTimeCond(
                min: modifiedFrom ?? DateTime.utc(-271820),
                max: modifiedUntil ?? DateTime.utc(275760),
              ),
      ),
    );

    final List<AssetEntity> assets =
        await onDevice.getAssetListRange(start: start, end: end);
    return assets.map(_toAsset).toList().cast();
  }

  @override
  Future<Album> getAlbumById(
    String id, {
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
  }) async {
    final assetPathEntity = await AssetPathEntity.fromId(id);
    return _toAlbum(assetPathEntity);
  }

  @override
  Future<Asset?> saveImage(
    Uint8List data, {
    required String title,
    String? relativePath,
  }) async {
    final entity = await PhotoManager.editor
        .saveImage(data, title: title, relativePath: relativePath);
    return _toAsset(entity);
  }

  @override
  Future<List<String>> deleteAssets(List<String> ids) =>
      PhotoManager.editor.deleteWithIds(ids);

  @override
  Future<void> clearFileCache() => PhotoManager.clearFileCache();

  @override
  Future<void> enableBackgroundAccess() =>
      PhotoManager.setIgnorePermissionCheck(true);

  @override
  Future<void> requestExtendedPermissions() =>
      PhotoManager.requestPermissionExtend();

  @override
  Future<Asset?> saveLivePhoto({
    required File image,
    required File video,
    required String title,
  }) async {
    final entity = await PhotoManager.editor.darwin.saveLivePhoto(
      imageFile: image,
      videoFile: video,
      title: title,
    );
    return _toAsset(entity);
  }

  @override
  Future<Asset?> saveVideo(
    File file, {
    required String title,
    String? relativePath,
  }) async {
    final entity = await PhotoManager.editor.saveVideo(
      file,
      title: title,
      relativePath: relativePath,
    );
    return _toAsset(entity);
  }

  static Album _toAlbum(AssetPathEntity assetPathEntity) {
    final Album album = Album(
      name: assetPathEntity.name,
      createdAt:
          assetPathEntity.lastModified?.toUtc() ?? DateTime.now().toUtc(),
      modifiedAt:
          assetPathEntity.lastModified?.toUtc() ?? DateTime.now().toUtc(),
      shared: false,
      activityEnabled: false,
    );
    album.owner.value = Store.get(StoreKey.currentUser);
    album.localId = assetPathEntity.id;
    album.isAll = assetPathEntity.isAll;
    return album;
  }

  static Asset? _toAsset(AssetEntity? local) {
    if (local == null) return null;
    final Asset asset = Asset(
      checksum: "",
      localId: local.id,
      ownerId: Store.get(StoreKey.currentUser).isarId,
      fileCreatedAt: local.createDateTime,
      fileModifiedAt: local.modifiedDateTime,
      updatedAt: local.modifiedDateTime,
      durationInSeconds: local.duration,
      type: AssetType.values[local.typeInt],
      fileName: local.title!,
      width: local.width,
      height: local.height,
      isFavorite: local.isFavorite,
    );
    if (asset.fileCreatedAt.year == 1970) {
      asset.fileCreatedAt = asset.fileModifiedAt;
    }
    if (local.latitude != null) {
      asset.exifInfo = ExifInfo(lat: local.latitude, long: local.longitude);
    }
    asset.local = local;
    return asset;
  }

  @override
  Future<Asset?> getAssetById(String id) async {
    final entity = await AssetEntity.fromId(id);
    return _toAsset(entity);
  }
}
