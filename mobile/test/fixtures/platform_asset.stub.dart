import 'package:immich_mobile/platform/messages.g.dart';

abstract final class PlatformAssetStub {
  static PlatformAsset get image1 => PlatformAsset(
        id: "asset1",
        name: "asset1.jpg",
        type: 1,
        createdAt: DateTime(2024, 1, 1).millisecondsSinceEpoch,
        updatedAt: DateTime(2024, 1, 1).millisecondsSinceEpoch,
        durationInSeconds: 0,
        albumIds: ["album1"],
      );

  static PlatformAsset get video1 => PlatformAsset(
        id: "asset2",
        name: "asset2.mp4",
        type: 2,
        createdAt: DateTime(2024, 1, 2).millisecondsSinceEpoch,
        updatedAt: DateTime(2024, 1, 2).millisecondsSinceEpoch,
        durationInSeconds: 120,
        albumIds: ["album1"],
      );
}
