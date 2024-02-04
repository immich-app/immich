import 'package:immich_mobile/modules/album/models/album.model.dart';

import 'asset.stub.dart';
import 'user.stub.dart';

final class AlbumStub {
  const AlbumStub._();

  static final emptyAlbum = RemoteAlbum(
    name: "empty-album",
    id: "empty-album-remote",
    createdAt: DateTime(2000),
    modifiedAt: DateTime(2023),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2020),
  );

  static final sharedWithUser = RemoteAlbum(
    name: "empty-album-shared-with-user",
    id: "empty-album-shared-with-user-remote",
    createdAt: DateTime(2023),
    modifiedAt: DateTime(2023),
    shared: true,
    activityEnabled: false,
    endDate: DateTime(2020),
  )..sharedUsers.addAll([UserStub.admin]);

  static final oneAsset = RemoteAlbum(
    name: "album-with-single-asset",
    id: "album-with-single-asset-remote",
    createdAt: DateTime(2022),
    modifiedAt: DateTime(2023),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2020),
    endDate: DateTime(2023),
  )..assets.addAll([AssetStub.image1]);

  static final twoAsset = RemoteAlbum(
    name: "album-with-two-assets",
    id: "album-with-two-assets-remote",
    createdAt: DateTime(2001),
    modifiedAt: DateTime(2010),
    shared: false,
    activityEnabled: true,
    startDate: DateTime(2019),
    endDate: DateTime(2020),
  )
    ..assets.addAll([AssetStub.image1, AssetStub.image2])
    ..owner.value = UserStub.admin;
}
