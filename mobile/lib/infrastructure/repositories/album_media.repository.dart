import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart' as asset;
import 'package:photo_manager/photo_manager.dart';

class AlbumMediaRepository implements IAlbumMediaRepository {
  const AlbumMediaRepository();

  @override
  Future<List<AssetPathEntity>> getAll({PMFilter? filter}) async {
    return await PhotoManager.getAssetPathList(
      hasAll: true,
      filterOption: filter,
    );
  }

  @override
  Future<List<asset.LocalAsset>> getAssetsForAlbum(
    AssetPathEntity assetPathEntity,
  ) async {
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
    return assets.toDtoList();
  }

  @override
  Future<AssetPathEntity> refresh(String albumId, {PMFilter? filter}) =>
      AssetPathEntity.obtainPathFromProperties(
        id: albumId,
        optionGroup: filter,
      );
}

extension AssetEntityMediaRepoX on AssetEntity {
  Future<asset.LocalAsset> toDto() async {
    return asset.LocalAsset(
      localId: id,
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
}

extension AssetEntityListMediaRepoX on List<AssetEntity> {
  Future<List<asset.LocalAsset>> toDtoList() =>
      Future.wait(map((a) => a.toDto()));
}
