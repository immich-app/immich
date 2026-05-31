// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Sync entity type
enum SyncEntityType {
  authUserV1._(r'AuthUserV1'),
  userV1._(r'UserV1'),
  userDeleteV1._(r'UserDeleteV1'),
  assetV1._(r'AssetV1'),
  assetV2._(r'AssetV2'),
  assetDeleteV1._(r'AssetDeleteV1'),
  assetExifV1._(r'AssetExifV1'),
  assetEditV1._(r'AssetEditV1'),
  assetEditDeleteV1._(r'AssetEditDeleteV1'),
  assetMetadataV1._(r'AssetMetadataV1'),
  assetMetadataDeleteV1._(r'AssetMetadataDeleteV1'),
  partnerV1._(r'PartnerV1'),
  partnerDeleteV1._(r'PartnerDeleteV1'),
  partnerAssetV1._(r'PartnerAssetV1'),
  partnerAssetV2._(r'PartnerAssetV2'),
  partnerAssetBackfillV1._(r'PartnerAssetBackfillV1'),
  partnerAssetBackfillV2._(r'PartnerAssetBackfillV2'),
  partnerAssetDeleteV1._(r'PartnerAssetDeleteV1'),
  partnerAssetExifV1._(r'PartnerAssetExifV1'),
  partnerAssetExifBackfillV1._(r'PartnerAssetExifBackfillV1'),
  partnerStackBackfillV1._(r'PartnerStackBackfillV1'),
  partnerStackDeleteV1._(r'PartnerStackDeleteV1'),
  partnerStackV1._(r'PartnerStackV1'),
  albumV1._(r'AlbumV1'),
  albumV2._(r'AlbumV2'),
  albumDeleteV1._(r'AlbumDeleteV1'),
  albumUserV1._(r'AlbumUserV1'),
  albumUserBackfillV1._(r'AlbumUserBackfillV1'),
  albumUserDeleteV1._(r'AlbumUserDeleteV1'),
  albumAssetCreateV1._(r'AlbumAssetCreateV1'),
  albumAssetCreateV2._(r'AlbumAssetCreateV2'),
  albumAssetUpdateV1._(r'AlbumAssetUpdateV1'),
  albumAssetUpdateV2._(r'AlbumAssetUpdateV2'),
  albumAssetBackfillV1._(r'AlbumAssetBackfillV1'),
  albumAssetBackfillV2._(r'AlbumAssetBackfillV2'),
  albumAssetExifCreateV1._(r'AlbumAssetExifCreateV1'),
  albumAssetExifUpdateV1._(r'AlbumAssetExifUpdateV1'),
  albumAssetExifBackfillV1._(r'AlbumAssetExifBackfillV1'),
  albumToAssetV1._(r'AlbumToAssetV1'),
  albumToAssetDeleteV1._(r'AlbumToAssetDeleteV1'),
  albumToAssetBackfillV1._(r'AlbumToAssetBackfillV1'),
  memoryV1._(r'MemoryV1'),
  memoryDeleteV1._(r'MemoryDeleteV1'),
  memoryToAssetV1._(r'MemoryToAssetV1'),
  memoryToAssetDeleteV1._(r'MemoryToAssetDeleteV1'),
  stackV1._(r'StackV1'),
  stackDeleteV1._(r'StackDeleteV1'),
  personV1._(r'PersonV1'),
  personDeleteV1._(r'PersonDeleteV1'),
  assetFaceV1._(r'AssetFaceV1'),
  assetFaceV2._(r'AssetFaceV2'),
  assetFaceDeleteV1._(r'AssetFaceDeleteV1'),
  userMetadataV1._(r'UserMetadataV1'),
  userMetadataDeleteV1._(r'UserMetadataDeleteV1'),
  syncAckV1._(r'SyncAckV1'),
  syncResetV1._(r'SyncResetV1'),
  syncCompleteV1._(r'SyncCompleteV1'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const SyncEntityType._(this.value);

  final String value;

  static SyncEntityType? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
