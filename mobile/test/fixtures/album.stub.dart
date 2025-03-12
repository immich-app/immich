import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';

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
  )..sharedUsers.addAll([User.fromDto(UserStub.admin)]);

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
    ..owner.value = User.fromDto(UserStub.admin);

  static final create2020end2020Album = Album(
    name: "create2020update2020Album",
    localId: "create2020update2020Album-local",
    remoteId: "create2020update2020Album-remote",
    createdAt: DateTime(2020),
    modifiedAt: DateTime(2020),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2020),
    endDate: DateTime(2020),
  );
  static final create2020end2022Album = Album(
    name: "create2020update2021Album",
    localId: "create2020update2021Album-local",
    remoteId: "create2020update2021Album-remote",
    createdAt: DateTime(2020),
    modifiedAt: DateTime(2022),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2020),
    endDate: DateTime(2022),
  );
  static final create2020end2024Album = Album(
    name: "create2020update2022Album",
    localId: "create2020update2022Album-local",
    remoteId: "create2020update2022Album-remote",
    createdAt: DateTime(2020),
    modifiedAt: DateTime(2024),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2020),
    endDate: DateTime(2024),
  );
  static final create2020end2026Album = Album(
    name: "create2020update2023Album",
    localId: "create2020update2023Album-local",
    remoteId: "create2020update2023Album-remote",
    createdAt: DateTime(2020),
    modifiedAt: DateTime(2026),
    shared: false,
    activityEnabled: false,
    startDate: DateTime(2020),
    endDate: DateTime(2026),
  );
}
