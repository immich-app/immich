import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

abstract final class LocalAssetStub {
  const LocalAssetStub._();

  static final image1 = LocalAsset(
    id: "image1",
    name: "image1.jpg",
    type: AssetType.image,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025, 2),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
  );

  static final image2 = LocalAsset(
    id: "image2",
    name: "image2.jpg",
    type: AssetType.image,
    createdAt: DateTime(2000),
    updatedAt: DateTime(20021),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
  );
}
