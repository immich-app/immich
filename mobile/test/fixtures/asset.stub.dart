import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart' as old;

final class AssetStub {
  const AssetStub._();

  static final image1 = old.Asset(
    checksum: "image1-checksum",
    localId: "image1",
    remoteId: 'image1-remote',
    ownerId: 1,
    fileCreatedAt: DateTime(2019),
    fileModifiedAt: DateTime(2020),
    updatedAt: DateTime.now(),
    durationInSeconds: 0,
    type: old.AssetType.image,
    fileName: "image1.jpg",
    isFavorite: true,
    isArchived: false,
    isTrashed: false,
    exifInfo: const ExifInfo(isFlipped: false),
  );

  static final image2 = old.Asset(
    checksum: "image2-checksum",
    localId: "image2",
    remoteId: 'image2-remote',
    ownerId: 1,
    fileCreatedAt: DateTime(2000),
    fileModifiedAt: DateTime(2010),
    updatedAt: DateTime.now(),
    durationInSeconds: 60,
    type: old.AssetType.video,
    fileName: "image2.jpg",
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    exifInfo: const ExifInfo(isFlipped: true),
  );

  static final image3 = old.Asset(
    checksum: "image3-checksum",
    localId: "image3",
    ownerId: 1,
    fileCreatedAt: DateTime(2025),
    fileModifiedAt: DateTime(2025),
    updatedAt: DateTime.now(),
    durationInSeconds: 60,
    type: old.AssetType.image,
    fileName: "image3.jpg",
    isFavorite: true,
    isArchived: false,
    isTrashed: false,
  );
}

abstract final class LocalAssetStub {
  const LocalAssetStub._();

  static final image1 = LocalAsset(
    id: "image1",
    name: "image1.jpg",
    type: AssetType.image,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025, 2),
  );

  static final image2 = LocalAsset(
    id: "image2",
    name: "image2.jpg",
    type: AssetType.image,
    createdAt: DateTime(2000),
    updatedAt: DateTime(20021),
  );
}
