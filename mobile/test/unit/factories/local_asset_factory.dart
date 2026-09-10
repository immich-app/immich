import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

import '../../utils.dart';

class LocalAssetFactory {
  const LocalAssetFactory();

  static LocalAsset create({String? id, String? name, String? remoteId}) {
    final assetId = TestUtils.uuid(id);

    return LocalAsset(
      id: assetId,
      name: name ?? 'local_$assetId.jpg',
      remoteId: remoteId,
      type: AssetType.image,
      createdAt: TestUtils.yesterday(),
      updatedAt: TestUtils.now(),
      playbackStyle: .image,
      isEdited: false,
    );
  }
}
