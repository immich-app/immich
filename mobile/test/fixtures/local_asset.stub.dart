import 'package:immich_mobile/domain/models/asset/asset.model.dart';

abstract final class LocalAssetStub {
  const LocalAssetStub();

  static LocalAsset get image1 => LocalAsset(
        localId: "image1",
        name: "image1.jpg",
        checksum: "image1-checksum",
        type: AssetType.image,
        createdAt: DateTime(2019),
        updatedAt: DateTime.now(),
        width: 1920,
        height: 1080,
        durationInSeconds: 0,
      );
}
