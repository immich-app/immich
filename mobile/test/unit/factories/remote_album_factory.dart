import 'package:immich_mobile/domain/models/album/album.model.dart';

import '../../utils.dart';

class RemoteAlbumFactory {
  const RemoteAlbumFactory();

  static RemoteAlbum create({
    String? id,
    String? name,
    String? ownerId,
    String? description,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? thumbnailAssetId,
    bool isActivityEnabled = false,
    AlbumAssetOrder order = AlbumAssetOrder.desc,
    int assetCount = 0,
    String? ownerName,
    bool isShared = false,
  }) {
    id = TestUtils.uuid(id);
    return RemoteAlbum(
      id: id,
      name: name ?? 'remote_album_$id',
      ownerId: TestUtils.uuid(ownerId),
      description: description ?? '',
      createdAt: TestUtils.date(createdAt),
      updatedAt: TestUtils.date(updatedAt),
      thumbnailAssetId: thumbnailAssetId,
      isActivityEnabled: isActivityEnabled,
      order: order,
      assetCount: assetCount,
      ownerName: ownerName ?? 'owner_$id',
      isShared: isShared,
    );
  }
}
