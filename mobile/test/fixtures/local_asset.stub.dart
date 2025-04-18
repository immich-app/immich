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

  static LocalAsset get image2 => LocalAsset(
        localId: "image2",
        name: "image2.jpg",
        checksum: "image2-checksum",
        type: AssetType.image,
        createdAt: DateTime(2020),
        updatedAt: DateTime(2023),
        width: 300,
        height: 400,
        durationInSeconds: 0,
      );

  static LocalAsset get video1 => LocalAsset(
        localId: "video1",
        name: "video1.mov",
        checksum: "video1-checksum",
        type: AssetType.video,
        createdAt: DateTime(2021),
        updatedAt: DateTime(2025),
        width: 720,
        height: 640,
        durationInSeconds: 120,
      );
}
