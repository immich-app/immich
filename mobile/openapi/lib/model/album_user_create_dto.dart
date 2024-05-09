//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumUserCreateDto {
  /// Returns a new [AlbumUserCreateDto] instance.
  AlbumUserCreateDto({
    required this.role,
    required this.userId,
  });

  AlbumUserCreateDtoRoleEnum role;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumUserCreateDto &&
    other.role == role &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (role.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'AlbumUserCreateDto[role=$role, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'role'] = this.role;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [AlbumUserCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumUserCreateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumUserCreateDto(
        role: AlbumUserCreateDtoRoleEnum.fromJson(json[r'role'])!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<AlbumUserCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumUserCreateDto> mapFromJson(dynamic json) {
    final map = <String, AlbumUserCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumUserCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumUserCreateDto-objects as value to a dart map
  static Map<String, List<AlbumUserCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumUserCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumUserCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'role',
    'userId',
  };
}


class AlbumUserCreateDtoRoleEnum {
  /// Instantiate a new enum with the provided [value].
  const AlbumUserCreateDtoRoleEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const editor = AlbumUserCreateDtoRoleEnum._(r'editor');
  static const viewer = AlbumUserCreateDtoRoleEnum._(r'viewer');

  /// List of all possible values in this [enum][AlbumUserCreateDtoRoleEnum].
  static const values = <AlbumUserCreateDtoRoleEnum>[
    editor,
    viewer,
  ];

  static AlbumUserCreateDtoRoleEnum? fromJson(dynamic value) => AlbumUserCreateDtoRoleEnumTypeTransformer().decode(value);

  static List<AlbumUserCreateDtoRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserCreateDtoRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserCreateDtoRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AlbumUserCreateDtoRoleEnum] to String,
/// and [decode] dynamic data back to [AlbumUserCreateDtoRoleEnum].
class AlbumUserCreateDtoRoleEnumTypeTransformer {
  factory AlbumUserCreateDtoRoleEnumTypeTransformer() => _instance ??= const AlbumUserCreateDtoRoleEnumTypeTransformer._();

  const AlbumUserCreateDtoRoleEnumTypeTransformer._();

  String encode(AlbumUserCreateDtoRoleEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AlbumUserCreateDtoRoleEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumUserCreateDtoRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'editor': return AlbumUserCreateDtoRoleEnum.editor;
        case r'viewer': return AlbumUserCreateDtoRoleEnum.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AlbumUserCreateDtoRoleEnumTypeTransformer] instance.
  static AlbumUserCreateDtoRoleEnumTypeTransformer? _instance;
}


