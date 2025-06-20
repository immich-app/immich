import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:photo_manager/photo_manager.dart' hide AssetType;

final albumMediaRepositoryProvider =
    Provider((ref) => const AlbumMediaRepository());

class AlbumMediaRepository {
  const AlbumMediaRepository();

  bool get useCustomFilter =>
      Store.get(StoreKey.photoManagerCustomFilter, false);

  FilterOptionGroup? _getAlbumFilter({
    DateTimeCond? updateTimeCond,
    bool? containsPathModified,
    List<OrderOption>? orderBy,
  }) =>
      useCustomFilter
          ? FilterOptionGroup(
              imageOption: const FilterOption(
                needTitle: true,
                sizeConstraint: SizeConstraint(ignoreSize: true),
              ),
              videoOption: const FilterOption(
                needTitle: true,
                sizeConstraint: SizeConstraint(ignoreSize: true),
                durationConstraint: DurationConstraint(allowNullable: true),
              ),
              containsPathModified: containsPathModified ?? false,
              createTimeCond: DateTimeCond.def().copyWith(ignore: true),
              updateTimeCond:
                  updateTimeCond ?? DateTimeCond.def().copyWith(ignore: true),
              orders: orderBy ?? [],
            )
          : null;

  Future<List<Album>> getAll() async {
    final filter = useCustomFilter
        ? CustomFilter.sql(where: '${CustomColumns.base.width} > 0')
        : FilterOptionGroup(containsPathModified: true);

    final List<AssetPathEntity> assetPathEntities =
        await PhotoManager.getAssetPathList(hasAll: true, filterOption: filter);
    return assetPathEntities.map(_toAlbum).toList();
  }

  Future<List<String>> getAssetIds(String albumId) async {
    final album =
        await AssetPathEntity.fromId(albumId, filterOption: _getAlbumFilter());
    final List<AssetEntity> assets =
        await album.getAssetListRange(start: 0, end: 0x7fffffffffffffff);
    return assets.map((e) => e.id).toList();
  }

  Future<int> getAssetCount(String albumId) async {
    final album =
        await AssetPathEntity.fromId(albumId, filterOption: _getAlbumFilter());
    return album.assetCountAsync;
  }

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
      filterOption: _getAlbumFilter(
        updateTimeCond: modifiedFrom == null && modifiedUntil == null
            ? null
            : DateTimeCond(
                min: modifiedFrom ?? DateTime.utc(-271820),
                max: modifiedUntil ?? DateTime.utc(275760),
              ),
        orderBy: orderByModificationDate
            ? [const OrderOption(type: OrderOptionType.updateDate)]
            : [],
      ),
    );

    final List<AssetEntity> assets =
        await onDevice.getAssetListRange(start: start, end: end);
    return assets.map(AssetMediaRepository.toAsset).toList().cast();
  }

  Future<Album> get(
    String id, {
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
  }) async {
    final assetPathEntity = await AssetPathEntity.fromId(
      id,
      filterOption: _getAlbumFilter(containsPathModified: true),
    );
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
    album.owner.value = User.fromDto(Store.get(StoreKey.currentUser));
    album.localId = assetPathEntity.id;
    album.isAll = assetPathEntity.isAll;
    return album;
  }
}
