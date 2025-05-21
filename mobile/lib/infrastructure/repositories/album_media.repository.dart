import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart'
    as asset;
import 'package:photo_manager/photo_manager.dart';

class AlbumMediaRepository implements IAlbumMediaRepository {
  const AlbumMediaRepository();

  PMFilter _getAlbumFilter({
    DateTimeFilter? createdTimeCond,
    DateTimeFilter? updateTimeCond,
  }) =>
      FilterOptionGroup(
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
        createTimeCond: createdTimeCond == null
            ? DateTimeCond.def().copyWith(ignore: true)
            : DateTimeCond(min: createdTimeCond.min, max: createdTimeCond.max),
        updateTimeCond: updateTimeCond == null
            ? DateTimeCond.def().copyWith(ignore: true)
            : DateTimeCond(min: updateTimeCond.min, max: updateTimeCond.max),
        orders: [],
      );

  @override
  Future<List<asset.LocalAsset>> getAssetsForAlbum(
    String albumId, {
    DateTimeFilter? updateTimeCond,
  }) async {
    final assetPathEntity = await AssetPathEntity.obtainPathFromProperties(
      id: albumId,
      optionGroup: _getAlbumFilter(updateTimeCond: updateTimeCond),
    );
    final assets = <AssetEntity>[];
    int pageNumber = 0, lastPageCount = 0;
    do {
      final page = await assetPathEntity.getAssetListPaged(
        page: pageNumber,
        size: kFetchLocalAssetsBatchSize,
      );
      assets.addAll(page);
      lastPageCount = page.length;
      pageNumber++;
    } while (lastPageCount == kFetchLocalAssetsBatchSize);
    return Future.wait(assets.map((a) => a.toDto()));
  }
}

extension on AssetEntity {
  Future<asset.LocalAsset> toDto() async => asset.LocalAsset(
        id: id,
        name: title ?? await titleAsync,
        type: switch (type) {
          AssetType.other => asset.AssetType.other,
          AssetType.image => asset.AssetType.image,
          AssetType.video => asset.AssetType.video,
          AssetType.audio => asset.AssetType.audio,
        },
        createdAt: createDateTime,
        updatedAt: modifiedDateTime,
        width: width,
        height: height,
        durationInSeconds: duration,
      );
}
