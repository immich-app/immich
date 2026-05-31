// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Sync request type
enum SyncRequestType {
  albumsV1._(r'AlbumsV1'),
  albumsV2._(r'AlbumsV2'),
  albumUsersV1._(r'AlbumUsersV1'),
  albumToAssetsV1._(r'AlbumToAssetsV1'),
  albumAssetsV1._(r'AlbumAssetsV1'),
  albumAssetsV2._(r'AlbumAssetsV2'),
  albumAssetExifsV1._(r'AlbumAssetExifsV1'),
  assetsV1._(r'AssetsV1'),
  assetsV2._(r'AssetsV2'),
  assetExifsV1._(r'AssetExifsV1'),
  assetEditsV1._(r'AssetEditsV1'),
  assetMetadataV1._(r'AssetMetadataV1'),
  authUsersV1._(r'AuthUsersV1'),
  memoriesV1._(r'MemoriesV1'),
  memoryToAssetsV1._(r'MemoryToAssetsV1'),
  partnersV1._(r'PartnersV1'),
  partnerAssetsV1._(r'PartnerAssetsV1'),
  partnerAssetsV2._(r'PartnerAssetsV2'),
  partnerAssetExifsV1._(r'PartnerAssetExifsV1'),
  partnerStacksV1._(r'PartnerStacksV1'),
  stacksV1._(r'StacksV1'),
  usersV1._(r'UsersV1'),
  peopleV1._(r'PeopleV1'),
  assetFacesV1._(r'AssetFacesV1'),
  assetFacesV2._(r'AssetFacesV2'),
  userMetadataV1._(r'UserMetadataV1'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const SyncRequestType._(this.value);

  final String value;

  static SyncRequestType? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
