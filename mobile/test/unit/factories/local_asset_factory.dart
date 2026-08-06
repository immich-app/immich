import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

import '../../utils.dart';

class LocalAssetFactory {
  const LocalAssetFactory();

  static LocalAsset create({String? id, String? name, String? remoteId}) {
    id = TestUtils.uuid(id);

    return LocalAsset(
      id: id,
      name: name ?? 'local_$id.jpg',
      remoteId: remoteId,
      type: AssetType.image,
      createdAt: TestUtils.yesterday(),
      updatedAt: TestUtils.now(),
      playbackStyle: .image,
      isEdited: false,
    );
  }
}
