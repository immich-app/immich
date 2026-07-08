import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

import '../../utils.dart';

class RemoteAssetFactory {
  const RemoteAssetFactory();

  static RemoteAsset create({
    String? id,
    String? name,
    String? ownerId,
    bool isFavorite = false,
    AssetVisibility visibility = .timeline,
    AssetType type = .image,
    String? stackId,
    DateTime? deletedAt,
    String? localId,
  }) {
    id = TestUtils.uuid(id);

    return RemoteAsset(
      id: id,
      name: name ?? 'remote_$id.jpg',
      ownerId: TestUtils.uuid(ownerId),
      checksum: 'checksum-$id',
      type: type,
      createdAt: TestUtils.yesterday(),
      updatedAt: TestUtils.now(),
      isFavorite: isFavorite,
      visibility: visibility,
      stackId: stackId,
      isEdited: false,
      deletedAt: deletedAt,
      localId: localId,
    );
  }
}
