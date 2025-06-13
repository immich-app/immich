import 'dart:typed_data';
import 'dart:ui';

import 'package:immich_mobile/domain/interfaces/asset_media.interface.dart';
import 'package:photo_manager/photo_manager.dart';

class AssetMediaRepository implements IAssetMediaRepository {
  const AssetMediaRepository();

  @override
  Future<Uint8List?> getThumbnail(
    String id, {
    int quality = 80,
    Size size = const Size.square(256),
  }) =>
      AssetEntity(
        id: id,
        // The below fields are not used in thumbnailDataWithSize but are required
        // to create an AssetEntity instance. It is faster to create an dummy AssetEntity
        // instance than to fetch the asset from the device first.
        typeInt: AssetType.image.index,
        width: size.width.toInt(),
        height: size.height.toInt(),
      ).thumbnailDataWithSize(
        ThumbnailSize(size.width.toInt(), size.height.toInt()),
        quality: quality,
      );
}
