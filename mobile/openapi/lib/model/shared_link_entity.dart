//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedLinkEntity {
  /// Returns a new [SharedLinkEntity] instance.
  SharedLinkEntity({
    this.album,
    required this.albumId,
    required this.allowDownload,
    required this.allowUpload,
    this.assets = const [],
    required this.createdAt,
    required this.description,
    required this.expiresAt,
    required this.id,
    required this.key,
    required this.showExif,
    required this.type,
    required this.user,
    required this.userId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AlbumEntity? album;

  String? albumId;

  bool allowDownload;

  bool allowUpload;

  List<AssetEntity> assets;

  DateTime createdAt;

  String? description;

  DateTime? expiresAt;

  String id;

  Object key;

  bool showExif;

  SharedLinkEntityTypeEnum type;

  UserEntity user;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedLinkEntity &&
     other.album == album &&
     other.albumId == albumId &&
     other.allowDownload == allowDownload &&
     other.allowUpload == allowUpload &&
     other.assets == assets &&
     other.createdAt == createdAt &&
     other.description == description &&
     other.expiresAt == expiresAt &&
     other.id == id &&
     other.key == key &&
     other.showExif == showExif &&
     other.type == type &&
     other.user == user &&
     other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (album == null ? 0 : album!.hashCode) +
    (albumId == null ? 0 : albumId!.hashCode) +
    (allowDownload.hashCode) +
    (allowUpload.hashCode) +
    (assets.hashCode) +
    (createdAt.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (id.hashCode) +
    (key.hashCode) +
    (showExif.hashCode) +
    (type.hashCode) +
    (user.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'SharedLinkEntity[album=$album, albumId=$albumId, allowDownload=$allowDownload, allowUpload=$allowUpload, assets=$assets, createdAt=$createdAt, description=$description, expiresAt=$expiresAt, id=$id, key=$key, showExif=$showExif, type=$type, user=$user, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.album != null) {
      json[r'album'] = this.album;
    } else {
    //  json[r'album'] = null;
    }
    if (this.albumId != null) {
      json[r'albumId'] = this.albumId;
    } else {
    //  json[r'albumId'] = null;
    }
      json[r'allowDownload'] = this.allowDownload;
      json[r'allowUpload'] = this.allowUpload;
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.expiresAt != null) {
      json[r'expiresAt'] = this.expiresAt!.toUtc().toIso8601String();
    } else {
    //  json[r'expiresAt'] = null;
    }
      json[r'id'] = this.id;
      json[r'key'] = this.key;
      json[r'showExif'] = this.showExif;
      json[r'type'] = this.type;
      json[r'user'] = this.user;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [SharedLinkEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedLinkEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedLinkEntity(
        album: AlbumEntity.fromJson(json[r'album']),
        albumId: mapValueOfType<String>(json, r'albumId'),
        allowDownload: mapValueOfType<bool>(json, r'allowDownload')!,
        allowUpload: mapValueOfType<bool>(json, r'allowUpload')!,
        assets: AssetEntity.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', '')!,
        description: mapValueOfType<String>(json, r'description'),
        expiresAt: mapDateTime(json, r'expiresAt', ''),
        id: mapValueOfType<String>(json, r'id')!,
        key: mapValueOfType<Object>(json, r'key')!,
        showExif: mapValueOfType<bool>(json, r'showExif')!,
        type: SharedLinkEntityTypeEnum.fromJson(json[r'type'])!,
        user: UserEntity.fromJson(json[r'user'])!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<SharedLinkEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinkEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinkEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedLinkEntity> mapFromJson(dynamic json) {
    final map = <String, SharedLinkEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedLinkEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedLinkEntity-objects as value to a dart map
  static Map<String, List<SharedLinkEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedLinkEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedLinkEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'allowDownload',
    'allowUpload',
    'assets',
    'createdAt',
    'description',
    'expiresAt',
    'id',
    'key',
    'showExif',
    'type',
    'user',
    'userId',
  };
}


class SharedLinkEntityTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const SharedLinkEntityTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const ALBUM = SharedLinkEntityTypeEnum._(r'ALBUM');
  static const INDIVIDUAL = SharedLinkEntityTypeEnum._(r'INDIVIDUAL');

  /// List of all possible values in this [enum][SharedLinkEntityTypeEnum].
  static const values = <SharedLinkEntityTypeEnum>[
    ALBUM,
    INDIVIDUAL,
  ];

  static SharedLinkEntityTypeEnum? fromJson(dynamic value) => SharedLinkEntityTypeEnumTypeTransformer().decode(value);

  static List<SharedLinkEntityTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinkEntityTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinkEntityTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SharedLinkEntityTypeEnum] to String,
/// and [decode] dynamic data back to [SharedLinkEntityTypeEnum].
class SharedLinkEntityTypeEnumTypeTransformer {
  factory SharedLinkEntityTypeEnumTypeTransformer() => _instance ??= const SharedLinkEntityTypeEnumTypeTransformer._();

  const SharedLinkEntityTypeEnumTypeTransformer._();

  String encode(SharedLinkEntityTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SharedLinkEntityTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SharedLinkEntityTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'ALBUM': return SharedLinkEntityTypeEnum.ALBUM;
        case r'INDIVIDUAL': return SharedLinkEntityTypeEnum.INDIVIDUAL;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SharedLinkEntityTypeEnumTypeTransformer] instance.
  static SharedLinkEntityTypeEnumTypeTransformer? _instance;
}


