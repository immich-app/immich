import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/album_media.interface.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:photo_manager/photo_manager.dart' hide AssetType;

final albumMediaRepositoryProvider = Provider((ref) => AlbumMediaRepository());

class AlbumMediaRepository implements IAlbumMediaRepository {
  @override
  Future<List<Album>> getAll() async {
    final List<AssetPathEntity> assetPathEntities =
        await PhotoManager.getAssetPathList(
      hasAll: true,
      filterOption: FilterOptionGroup(containsPathModified: true),
    );
    return assetPathEntities.map(_toAlbum).toList();
  }

  @override
  Future<List<String>> getAssetIds(String albumId) async {
    final album = await AssetPathEntity.fromId(albumId);
    final List<AssetEntity> assets =
        await album.getAssetListRange(start: 0, end: 0x7fffffffffffffff);
    return assets.map((e) => e.id).toList();
  }

  @override
  Future<int> getAssetCount(String albumId) async {
    final album = await AssetPathEntity.fromId(albumId);
    return album.assetCountAsync;
  }

  @override
  Future<List<Asset>> getAssets(
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
    return assets.map(AssetMediaRepository.toAsset).toList().cast();
  }

  @override
  Future<Album> get(
    String id, {
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
  }) async {
    final assetPathEntity = await AssetPathEntity.fromId(id);
    return _toAlbum(assetPathEntity);
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
}
