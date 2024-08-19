//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumEntity {
  /// Returns a new [AlbumEntity] instance.
  AlbumEntity({
    required this.albumName,
    required this.albumThumbnailAsset,
    required this.albumThumbnailAssetId,
    this.albumUsers = const [],
    this.assets = const [],
    required this.createdAt,
    required this.deletedAt,
    required this.description,
    required this.id,
    required this.isActivityEnabled,
    required this.order,
    required this.owner,
    required this.ownerId,
    this.sharedLinks = const [],
    required this.updatedAt,
  });

  String albumName;

  AssetEntity? albumThumbnailAsset;

  String? albumThumbnailAssetId;

  List<AlbumUserEntity> albumUsers;

  List<AssetEntity> assets;

  DateTime createdAt;

  DateTime? deletedAt;

  String description;

  String id;

  bool isActivityEnabled;

  AlbumEntityOrderEnum order;

  UserEntity owner;

  String ownerId;

  List<SharedLinkEntity> sharedLinks;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumEntity &&
    other.albumName == albumName &&
    other.albumThumbnailAsset == albumThumbnailAsset &&
    other.albumThumbnailAssetId == albumThumbnailAssetId &&
    _deepEquality.equals(other.albumUsers, albumUsers) &&
    _deepEquality.equals(other.assets, assets) &&
    other.createdAt == createdAt &&
    other.deletedAt == deletedAt &&
    other.description == description &&
    other.id == id &&
    other.isActivityEnabled == isActivityEnabled &&
    other.order == order &&
    other.owner == owner &&
    other.ownerId == ownerId &&
    _deepEquality.equals(other.sharedLinks, sharedLinks) &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumName.hashCode) +
    (albumThumbnailAsset == null ? 0 : albumThumbnailAsset!.hashCode) +
    (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode) +
    (albumUsers.hashCode) +
    (assets.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (description.hashCode) +
    (id.hashCode) +
    (isActivityEnabled.hashCode) +
    (order.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (sharedLinks.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AlbumEntity[albumName=$albumName, albumThumbnailAsset=$albumThumbnailAsset, albumThumbnailAssetId=$albumThumbnailAssetId, albumUsers=$albumUsers, assets=$assets, createdAt=$createdAt, deletedAt=$deletedAt, description=$description, id=$id, isActivityEnabled=$isActivityEnabled, order=$order, owner=$owner, ownerId=$ownerId, sharedLinks=$sharedLinks, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumName'] = this.albumName;
    if (this.albumThumbnailAsset != null) {
      json[r'albumThumbnailAsset'] = this.albumThumbnailAsset;
    } else {
    //  json[r'albumThumbnailAsset'] = null;
    }
    if (this.albumThumbnailAssetId != null) {
      json[r'albumThumbnailAssetId'] = this.albumThumbnailAssetId;
    } else {
    //  json[r'albumThumbnailAssetId'] = null;
    }
      json[r'albumUsers'] = this.albumUsers;
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'description'] = this.description;
      json[r'id'] = this.id;
      json[r'isActivityEnabled'] = this.isActivityEnabled;
      json[r'order'] = this.order;
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
      json[r'sharedLinks'] = this.sharedLinks;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [AlbumEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumEntity(
        albumName: mapValueOfType<String>(json, r'albumName')!,
        albumThumbnailAsset: AssetEntity.fromJson(json[r'albumThumbnailAsset']),
        albumThumbnailAssetId: mapValueOfType<String>(json, r'albumThumbnailAssetId'),
        albumUsers: AlbumUserEntity.listFromJson(json[r'albumUsers']),
        assets: AssetEntity.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        description: mapValueOfType<String>(json, r'description')!,
        id: mapValueOfType<String>(json, r'id')!,
        isActivityEnabled: mapValueOfType<bool>(json, r'isActivityEnabled')!,
        order: AlbumEntityOrderEnum.fromJson(json[r'order'])!,
        owner: UserEntity.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        sharedLinks: SharedLinkEntity.listFromJson(json[r'sharedLinks']),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<AlbumEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumEntity> mapFromJson(dynamic json) {
    final map = <String, AlbumEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumEntity-objects as value to a dart map
  static Map<String, List<AlbumEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumName',
    'albumThumbnailAsset',
    'albumThumbnailAssetId',
    'albumUsers',
    'assets',
    'createdAt',
    'deletedAt',
    'description',
    'id',
    'isActivityEnabled',
    'order',
    'owner',
    'ownerId',
    'sharedLinks',
    'updatedAt',
  };
}


class AlbumEntityOrderEnum {
  /// Instantiate a new enum with the provided [value].
  const AlbumEntityOrderEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asc = AlbumEntityOrderEnum._(r'asc');
  static const desc = AlbumEntityOrderEnum._(r'desc');

  /// List of all possible values in this [enum][AlbumEntityOrderEnum].
  static const values = <AlbumEntityOrderEnum>[
    asc,
    desc,
  ];

  static AlbumEntityOrderEnum? fromJson(dynamic value) => AlbumEntityOrderEnumTypeTransformer().decode(value);

  static List<AlbumEntityOrderEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumEntityOrderEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumEntityOrderEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AlbumEntityOrderEnum] to String,
/// and [decode] dynamic data back to [AlbumEntityOrderEnum].
class AlbumEntityOrderEnumTypeTransformer {
  factory AlbumEntityOrderEnumTypeTransformer() => _instance ??= const AlbumEntityOrderEnumTypeTransformer._();

  const AlbumEntityOrderEnumTypeTransformer._();

  String encode(AlbumEntityOrderEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AlbumEntityOrderEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumEntityOrderEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asc': return AlbumEntityOrderEnum.asc;
        case r'desc': return AlbumEntityOrderEnum.desc;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AlbumEntityOrderEnumTypeTransformer] instance.
  static AlbumEntityOrderEnumTypeTransformer? _instance;
}


