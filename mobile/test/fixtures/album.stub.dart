import 'package:immich_mobile/entities/album.entity.dart';

import 'asset.stub.dart';
import 'user.stub.dart';

final class AlbumStub {
  const AlbumStub._();

  static final emptyAlbum = Album(
    name: "empty-album",
    localId: "empty-album-local",
    remoteId: "empty-album-remote",
    createdAt: DateTime(2000),
    modifiedAt: DateTime(2023),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2020),
  );

  static final sharedWithUser = Album(
    name: "empty-album-shared-with-user",
    localId: "empty-album-shared-with-user-local",
    remoteId: "empty-album-shared-with-user-remote",
    createdAt: DateTime(2023),
    modifiedAt: DateTime(2023),
    shared: true,
    activityEnabled: false,
    endDate: DateTime(2020),
  )..sharedUsers.addAll([UserStub.admin]);

  static final oneAsset = Album(
    name: "album-with-single-asset",
    localId: "album-with-single-asset-local",
    remoteId: "album-with-single-asset-remote",
    createdAt: DateTime(2022),
    modifiedAt: DateTime(2023),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2020),
    endDate: DateTime(2023),
  )..assets.addAll([AssetStub.image1]);

  static final twoAsset = Album(
    name: "album-with-two-assets",
    localId: "album-with-two-assets-local",
    remoteId: "album-with-two-assets-remote",
    createdAt: DateTime(2001),
    modifiedAt: DateTime(2010),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2019),
    endDate: DateTime(2020),
  )
    ..assets.addAll([AssetStub.image1, AssetStub.image2])
    ..activityEnabled = true
    ..owner.value = UserStub.admin;
}
