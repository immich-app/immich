import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart'
    as asset;
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:platform/platform.dart';

class AlbumMediaRepository implements IAlbumMediaRepository {
  final Platform _platform;
  const AlbumMediaRepository({Platform platform = const LocalPlatform()})
      : _platform = platform;

  PMFilter _getAlbumFilter({DateTimeFilter? updateTimeCond}) =>
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
        createTimeCond: DateTimeCond.def().copyWith(ignore: true),
        updateTimeCond: updateTimeCond == null
            ? DateTimeCond.def().copyWith(ignore: true)
            : DateTimeCond(min: updateTimeCond.min, max: updateTimeCond.max),
        orders: const [
          // Always sort the result by createdDate.des to update the thumbnail
          OrderOption(type: OrderOptionType.createDate, asc: false),
        ],
      );

  @override
  Future<List<LocalAlbum>> getAll({bool withModifiedTime = false}) {
    return PhotoManager.getAssetPathList(
      hasAll: true,
      filterOption: _getAlbumFilter(),
    ).then((e) {
      if (_platform.isAndroid) {
        e.removeWhere((a) => a.isAll);
      }
      return Future.wait(e.map((a) => a.toDto()));
    });
  }

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

extension on AssetPathEntity {
  Future<LocalAlbum> toDto({bool withAssetCount = true}) async => LocalAlbum(
        id: id,
        name: name,
        updatedAt: lastModified ?? DateTime.now(),
        // the assetCountAsync call is expensive for larger albums with several thousand assets
        assetCount: withAssetCount ? await assetCountAsync : 0,
        backupSelection: BackupSelection.none,
      );
}
