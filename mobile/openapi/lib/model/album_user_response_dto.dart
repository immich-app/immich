//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumUserResponseDto {
  /// Returns a new [AlbumUserResponseDto] instance.
  AlbumUserResponseDto({
    required this.role,
    required this.user,
  });

  /// Album user role
  AlbumUserResponseDtoRoleEnum role;

  UserResponseDto user;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumUserResponseDto &&
    other.role == role &&
    other.user == user;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (role.hashCode) +
    (user.hashCode);

  @override
  String toString() => 'AlbumUserResponseDto[role=$role, user=$user]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'role'] = this.role;
      json[r'user'] = this.user;
    return json;
  }

  /// Returns a new [AlbumUserResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumUserResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumUserResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumUserResponseDto(
        role: AlbumUserResponseDtoRoleEnum.fromJson(json[r'role'])!,
        user: UserResponseDto.fromJson(json[r'user'])!,
      );
    }
    return null;
  }

  static List<AlbumUserResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumUserResponseDto> mapFromJson(dynamic json) {
    final map = <String, AlbumUserResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumUserResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumUserResponseDto-objects as value to a dart map
  static Map<String, List<AlbumUserResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumUserResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumUserResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'role',
    'user',
  };
}

/// Album user role
class AlbumUserResponseDtoRoleEnum {
  /// Instantiate a new enum with the provided [value].
  const AlbumUserResponseDtoRoleEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const editor = AlbumUserResponseDtoRoleEnum._(r'editor');
  static const viewer = AlbumUserResponseDtoRoleEnum._(r'viewer');

  /// List of all possible values in this [enum][AlbumUserResponseDtoRoleEnum].
  static const values = <AlbumUserResponseDtoRoleEnum>[
    editor,
    viewer,
  ];

  static AlbumUserResponseDtoRoleEnum? fromJson(dynamic value) => AlbumUserResponseDtoRoleEnumTypeTransformer().decode(value);

  static List<AlbumUserResponseDtoRoleEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserResponseDtoRoleEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserResponseDtoRoleEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AlbumUserResponseDtoRoleEnum] to String,
/// and [decode] dynamic data back to [AlbumUserResponseDtoRoleEnum].
class AlbumUserResponseDtoRoleEnumTypeTransformer {
  factory AlbumUserResponseDtoRoleEnumTypeTransformer() => _instance ??= const AlbumUserResponseDtoRoleEnumTypeTransformer._();

  const AlbumUserResponseDtoRoleEnumTypeTransformer._();

  String encode(AlbumUserResponseDtoRoleEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AlbumUserResponseDtoRoleEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumUserResponseDtoRoleEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'editor': return AlbumUserResponseDtoRoleEnum.editor;
        case r'viewer': return AlbumUserResponseDtoRoleEnum.viewer;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AlbumUserResponseDtoRoleEnumTypeTransformer] instance.
  static AlbumUserResponseDtoRoleEnumTypeTransformer? _instance;
}


