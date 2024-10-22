import 'dart:io';

import 'package:immich_mobile/domain/interfaces/device_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/models/album.model.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:photo_manager/photo_manager.dart';

class DeviceAlbumRepository with LogMixin implements IDeviceAlbumRepository {
  const DeviceAlbumRepository();

  @override
  Future<List<Album>> getAll() async {
    final List<AssetPathEntity> assetPathEntities =
        await PhotoManager.getAssetPathList(
      hasAll: Platform.isIOS,
      filterOption: FilterOptionGroup(containsPathModified: true),
    );
    return assetPathEntities.map(_toModel).toList();
  }

  @override
  Future<List<Asset>> getAssetsForAlbum(
    String albumId, {
    int start = 0,
    int end = 0x7fffffffffffffff,
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
    bool orderByModificationDate = false,
  }) async {
    final album = await _getDeviceAlbum(
      albumId,
      modifiedFrom: modifiedFrom,
      modifiedUntil: modifiedUntil,
      orderByModificationDate: orderByModificationDate,
    );
    final List<AssetEntity> assets =
        await album.getAssetListRange(start: start, end: end);
    return await Future.wait(
      assets.map((a) async => await di<IDeviceAssetRepository>().toAsset(a)),
    );
  }

  Future<AssetPathEntity> _getDeviceAlbum(
    String albumId, {
    DateTime? modifiedFrom,
    DateTime? modifiedUntil,
    bool orderByModificationDate = false,
  }) async {
    return await AssetPathEntity.fromId(
      albumId,
      filterOption: FilterOptionGroup(
        imageOption: const FilterOption(needTitle: true),
        videoOption: const FilterOption(needTitle: true),
        containsPathModified: true,
        updateTimeCond: DateTimeCond(
          min: modifiedFrom ?? DateTime.utc(-271820),
          max: modifiedUntil ?? DateTime.utc(275760),
          ignore: modifiedFrom != null || modifiedUntil != null,
        ),
        orders: orderByModificationDate
            ? [const OrderOption(type: OrderOptionType.updateDate)]
            : [],
      ),
    );
  }

  @override
  Future<int> getAssetCount(String albumId) async {
    final album = await _getDeviceAlbum(albumId);
    return await album.assetCountAsync;
  }
}

Album _toModel(AssetPathEntity album) {
  return Album(
    localId: album.id,
    name: album.name,
    modifiedTime: album.lastModified ?? DateTime.now(),
  );
}
