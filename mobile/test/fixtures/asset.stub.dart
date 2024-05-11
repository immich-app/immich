import 'package:immich_mobile/entities/asset.entity.dart';

final class AssetStub {
  const AssetStub._();

  static final image1 = Asset(
    checksum: "image1-checksum",
    localId: "image1",
    remoteId: 'image1-remote',
    ownerId: 1,
    fileCreatedAt: DateTime.now(),
    fileModifiedAt: DateTime.now(),
    updatedAt: DateTime.now(),
    durationInSeconds: 0,
    type: AssetType.image,
    fileName: "image1.jpg",
    isFavorite: true,
    isArchived: false,
    isTrashed: false,
    stackCount: 0,
  );

  static final image2 = Asset(
    checksum: "image2-checksum",
    localId: "image2",
    remoteId: 'image2-remote',
    ownerId: 1,
    fileCreatedAt: DateTime(2000),
    fileModifiedAt: DateTime(2010),
    updatedAt: DateTime.now(),
    durationInSeconds: 60,
    type: AssetType.video,
    fileName: "image2.jpg",
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    stackCount: 0,
  );
}
