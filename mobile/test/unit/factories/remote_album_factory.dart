import 'package:immich_mobile/domain/models/album/album.model.dart';

import '../../utils.dart';

class RemoteAlbumFactory {
  const RemoteAlbumFactory();

  static RemoteAlbum create({String? id, String? ownerId, bool isActivityEnabled = false, bool isShared = false}) {
    id = TestUtils.uuid(id);

    return RemoteAlbum(
      id: id,
      name: 'album_$id',
      ownerId: TestUtils.uuid(ownerId),
      description: '',
      createdAt: TestUtils.yesterday(),
      updatedAt: TestUtils.now(),
      isActivityEnabled: isActivityEnabled,
      order: AlbumAssetOrder.desc,
      assetCount: 1,
      ownerName: 'owner',
      isShared: isShared,
    );
  }
}
