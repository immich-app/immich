//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

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
  assetOcrV1._(r'AssetOcrV1'),
  assetOcrDeleteV1._(r'AssetOcrDeleteV1'),
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
  ;

  /// Instantiate a new enum with the provided value.
  const SyncEntityType._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [SyncEntityType] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static SyncEntityType? fromJson(dynamic value) => SyncEntityTypeTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [SyncEntityType]
  /// that were successfully decoded from the passed [JSON][json].
  static List<SyncEntityType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncEntityType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncEntityType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncEntityType] to String,
/// and [decode] dynamic data back to [SyncEntityType].
class SyncEntityTypeTypeTransformer {
  factory SyncEntityTypeTypeTransformer() => _instance ??= const SyncEntityTypeTypeTransformer._();

  const SyncEntityTypeTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(SyncEntityType data) => data._value;

  /// Returns the instance of [SyncEntityType] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncEntityType? decode(dynamic data, {bool allowNull = true}) {
    if (data is SyncEntityType) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'AuthUserV1': return SyncEntityType.authUserV1;
        case r'UserV1': return SyncEntityType.userV1;
        case r'UserDeleteV1': return SyncEntityType.userDeleteV1;
        case r'AssetV1': return SyncEntityType.assetV1;
        case r'AssetV2': return SyncEntityType.assetV2;
        case r'AssetDeleteV1': return SyncEntityType.assetDeleteV1;
        case r'AssetExifV1': return SyncEntityType.assetExifV1;
        case r'AssetEditV1': return SyncEntityType.assetEditV1;
        case r'AssetEditDeleteV1': return SyncEntityType.assetEditDeleteV1;
        case r'AssetMetadataV1': return SyncEntityType.assetMetadataV1;
        case r'AssetMetadataDeleteV1': return SyncEntityType.assetMetadataDeleteV1;
        case r'AssetOcrV1': return SyncEntityType.assetOcrV1;
        case r'AssetOcrDeleteV1': return SyncEntityType.assetOcrDeleteV1;
        case r'PartnerV1': return SyncEntityType.partnerV1;
        case r'PartnerDeleteV1': return SyncEntityType.partnerDeleteV1;
        case r'PartnerAssetV1': return SyncEntityType.partnerAssetV1;
        case r'PartnerAssetV2': return SyncEntityType.partnerAssetV2;
        case r'PartnerAssetBackfillV1': return SyncEntityType.partnerAssetBackfillV1;
        case r'PartnerAssetBackfillV2': return SyncEntityType.partnerAssetBackfillV2;
        case r'PartnerAssetDeleteV1': return SyncEntityType.partnerAssetDeleteV1;
        case r'PartnerAssetExifV1': return SyncEntityType.partnerAssetExifV1;
        case r'PartnerAssetExifBackfillV1': return SyncEntityType.partnerAssetExifBackfillV1;
        case r'PartnerStackBackfillV1': return SyncEntityType.partnerStackBackfillV1;
        case r'PartnerStackDeleteV1': return SyncEntityType.partnerStackDeleteV1;
        case r'PartnerStackV1': return SyncEntityType.partnerStackV1;
        case r'AlbumV1': return SyncEntityType.albumV1;
        case r'AlbumV2': return SyncEntityType.albumV2;
        case r'AlbumDeleteV1': return SyncEntityType.albumDeleteV1;
        case r'AlbumUserV1': return SyncEntityType.albumUserV1;
        case r'AlbumUserBackfillV1': return SyncEntityType.albumUserBackfillV1;
        case r'AlbumUserDeleteV1': return SyncEntityType.albumUserDeleteV1;
        case r'AlbumAssetCreateV1': return SyncEntityType.albumAssetCreateV1;
        case r'AlbumAssetCreateV2': return SyncEntityType.albumAssetCreateV2;
        case r'AlbumAssetUpdateV1': return SyncEntityType.albumAssetUpdateV1;
        case r'AlbumAssetUpdateV2': return SyncEntityType.albumAssetUpdateV2;
        case r'AlbumAssetBackfillV1': return SyncEntityType.albumAssetBackfillV1;
        case r'AlbumAssetBackfillV2': return SyncEntityType.albumAssetBackfillV2;
        case r'AlbumAssetExifCreateV1': return SyncEntityType.albumAssetExifCreateV1;
        case r'AlbumAssetExifUpdateV1': return SyncEntityType.albumAssetExifUpdateV1;
        case r'AlbumAssetExifBackfillV1': return SyncEntityType.albumAssetExifBackfillV1;
        case r'AlbumToAssetV1': return SyncEntityType.albumToAssetV1;
        case r'AlbumToAssetDeleteV1': return SyncEntityType.albumToAssetDeleteV1;
        case r'AlbumToAssetBackfillV1': return SyncEntityType.albumToAssetBackfillV1;
        case r'MemoryV1': return SyncEntityType.memoryV1;
        case r'MemoryDeleteV1': return SyncEntityType.memoryDeleteV1;
        case r'MemoryToAssetV1': return SyncEntityType.memoryToAssetV1;
        case r'MemoryToAssetDeleteV1': return SyncEntityType.memoryToAssetDeleteV1;
        case r'StackV1': return SyncEntityType.stackV1;
        case r'StackDeleteV1': return SyncEntityType.stackDeleteV1;
        case r'PersonV1': return SyncEntityType.personV1;
        case r'PersonDeleteV1': return SyncEntityType.personDeleteV1;
        case r'AssetFaceV1': return SyncEntityType.assetFaceV1;
        case r'AssetFaceV2': return SyncEntityType.assetFaceV2;
        case r'AssetFaceDeleteV1': return SyncEntityType.assetFaceDeleteV1;
        case r'UserMetadataV1': return SyncEntityType.userMetadataV1;
        case r'UserMetadataDeleteV1': return SyncEntityType.userMetadataDeleteV1;
        case r'SyncAckV1': return SyncEntityType.syncAckV1;
        case r'SyncResetV1': return SyncEntityType.syncResetV1;
        case r'SyncCompleteV1': return SyncEntityType.syncCompleteV1;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static SyncEntityTypeTypeTransformer? _instance;
}

