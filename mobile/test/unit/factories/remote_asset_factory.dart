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
    final assetId = TestUtils.uuid(id);

    return RemoteAsset(
      id: assetId,
      name: name ?? 'remote_$assetId.jpg',
      ownerId: TestUtils.uuid(ownerId),
      checksum: 'checksum-$assetId',
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
