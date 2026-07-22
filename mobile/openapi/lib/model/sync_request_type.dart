//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

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
  assetOcrV1._(r'AssetOcrV1'),
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
  ;

  /// Instantiate a new enum with the provided value.
  const SyncRequestType._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [SyncRequestType] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static SyncRequestType? fromJson(dynamic value) => SyncRequestTypeTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [SyncRequestType]
  /// that were successfully decoded from the passed [JSON][json].
  static List<SyncRequestType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncRequestType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncRequestType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SyncRequestType] to String,
/// and [decode] dynamic data back to [SyncRequestType].
class SyncRequestTypeTypeTransformer {
  factory SyncRequestTypeTypeTransformer() => _instance ??= const SyncRequestTypeTypeTransformer._();

  const SyncRequestTypeTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(SyncRequestType data) => data._value;

  /// Returns the instance of [SyncRequestType] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SyncRequestType? decode(dynamic data, {bool allowNull = true}) {
    if (data is SyncRequestType) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'AlbumsV1': return SyncRequestType.albumsV1;
        case r'AlbumsV2': return SyncRequestType.albumsV2;
        case r'AlbumUsersV1': return SyncRequestType.albumUsersV1;
        case r'AlbumToAssetsV1': return SyncRequestType.albumToAssetsV1;
        case r'AlbumAssetsV1': return SyncRequestType.albumAssetsV1;
        case r'AlbumAssetsV2': return SyncRequestType.albumAssetsV2;
        case r'AlbumAssetExifsV1': return SyncRequestType.albumAssetExifsV1;
        case r'AssetsV1': return SyncRequestType.assetsV1;
        case r'AssetsV2': return SyncRequestType.assetsV2;
        case r'AssetExifsV1': return SyncRequestType.assetExifsV1;
        case r'AssetEditsV1': return SyncRequestType.assetEditsV1;
        case r'AssetMetadataV1': return SyncRequestType.assetMetadataV1;
        case r'AssetOcrV1': return SyncRequestType.assetOcrV1;
        case r'AuthUsersV1': return SyncRequestType.authUsersV1;
        case r'MemoriesV1': return SyncRequestType.memoriesV1;
        case r'MemoryToAssetsV1': return SyncRequestType.memoryToAssetsV1;
        case r'PartnersV1': return SyncRequestType.partnersV1;
        case r'PartnerAssetsV1': return SyncRequestType.partnerAssetsV1;
        case r'PartnerAssetsV2': return SyncRequestType.partnerAssetsV2;
        case r'PartnerAssetExifsV1': return SyncRequestType.partnerAssetExifsV1;
        case r'PartnerStacksV1': return SyncRequestType.partnerStacksV1;
        case r'StacksV1': return SyncRequestType.stacksV1;
        case r'UsersV1': return SyncRequestType.usersV1;
        case r'PeopleV1': return SyncRequestType.peopleV1;
        case r'AssetFacesV1': return SyncRequestType.assetFacesV1;
        case r'AssetFacesV2': return SyncRequestType.assetFacesV2;
        case r'UserMetadataV1': return SyncRequestType.userMetadataV1;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static SyncRequestTypeTypeTransformer? _instance;
}

