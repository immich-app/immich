//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumUserEntity {
  /// Returns a new [AlbumUserEntity] instance.
  AlbumUserEntity({
    required this.album,
    required this.albumId,
    required this.role,
    required this.user,
    required this.userId,
  });

  AlbumEntity album;

  String albumId;

  AlbumUserEntityRoleEnum role;

  UserEntity user;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumUserEntity &&
    other.album == album &&
    other.albumId == albumId &&
    other.role == role &&
    other.user == user &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (album.hashCode) +
    (albumId.hashCode) +
    (role.hashCode) +
    (user.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'AlbumUserEntity[album=$album, albumId=$albumId, role=$role, user=$user, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'album'] = this.album;
      json[r'albumId'] = this.albumId;
      json[r'role'] = this.role;
      json[r'user'] = this.user;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [AlbumUserEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumUserEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumUserEntity(
        album: AlbumEntity.fromJson(json[r'album'])!,
        albumId: mapValueOfType<String>(json, r'albumId')!,
        role: AlbumUserEntityRoleEnum.fromJson(json[r'role'])!,
        user: UserEntity.fromJson(json[r'user'])!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<AlbumUserEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumUserEntity> mapFromJson(dynamic json) {
    final map = <String, AlbumUserEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumUserEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumUserEntity-objects as value to a dart map
  static Map<String, List<AlbumUserEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumUserEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumUserEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'album',
    'albumId',
    'role',
    'user',
    'userId',
  };
}


class AlbumUserEntityRoleEnum {
  /// Instantiate a new enum with the provided [value].
  const AlbumUserEntityRoleEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const editor = AlbumUserEntityRoleEnum._(r'editor');
  static const viewer = AlbumUserEntityRoleEnum._(r'viewer');

  /// List of all possible values in this [enum][AlbumUserEntityRoleEnum].
  static const values = <AlbumUserEntityRoleEnum>[
    editor,
    viewer,
  ];

  static AlbumUserEntityRoleEnum? fromJson(dynamic value) => AlbumUserEntityRoleEnumTypeTransformer().decode(value);

  static List<AlbumUserEntityRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserEntityRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserEntityRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AlbumUserEntityRoleEnum] to String,
/// and [decode] dynamic data back to [AlbumUserEntityRoleEnum].
class AlbumUserEntityRoleEnumTypeTransformer {
  factory AlbumUserEntityRoleEnumTypeTransformer() => _instance ??= const AlbumUserEntityRoleEnumTypeTransformer._();

  const AlbumUserEntityRoleEnumTypeTransformer._();

  String encode(AlbumUserEntityRoleEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AlbumUserEntityRoleEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumUserEntityRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'editor': return AlbumUserEntityRoleEnum.editor;
        case r'viewer': return AlbumUserEntityRoleEnum.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AlbumUserEntityRoleEnumTypeTransformer] instance.
  static AlbumUserEntityRoleEnumTypeTransformer? _instance;
}


