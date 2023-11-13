//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserDto {
  /// Returns a new [UserDto] instance.
  UserDto({
    required this.avatarColor,
    required this.email,
    required this.id,
    required this.name,
    required this.profileImagePath,
  });

  UserDtoAvatarColorEnum avatarColor;

  String email;

  String id;

  String name;

  String profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserDto &&
     other.avatarColor == avatarColor &&
     other.email == email &&
     other.id == id &&
     other.name == name &&
     other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (profileImagePath.hashCode);

  @override
  String toString() => 'UserDto[avatarColor=$avatarColor, email=$email, id=$id, name=$name, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatarColor'] = this.avatarColor;
      json[r'email'] = this.email;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'profileImagePath'] = this.profileImagePath;
    return json;
  }

  /// Returns a new [UserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserDto(
        avatarColor: UserDtoAvatarColorEnum.fromJson(json[r'avatarColor'])!,
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
      );
    }
    return null;
  }

  static List<UserDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserDto> mapFromJson(dynamic json) {
    final map = <String, UserDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserDto-objects as value to a dart map
  static Map<String, List<UserDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'avatarColor',
    'email',
    'id',
    'name',
    'profileImagePath',
  };
}


class UserDtoAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const UserDtoAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = UserDtoAvatarColorEnum._(r'primary');
  static const pink = UserDtoAvatarColorEnum._(r'pink');
  static const red = UserDtoAvatarColorEnum._(r'red');
  static const yellow = UserDtoAvatarColorEnum._(r'yellow');
  static const blue = UserDtoAvatarColorEnum._(r'blue');
  static const green = UserDtoAvatarColorEnum._(r'green');
  static const purple = UserDtoAvatarColorEnum._(r'purple');
  static const orange = UserDtoAvatarColorEnum._(r'orange');
  static const gray = UserDtoAvatarColorEnum._(r'gray');
  static const amber = UserDtoAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][UserDtoAvatarColorEnum].
  static const values = <UserDtoAvatarColorEnum>[
    primary,
    pink,
    red,
    yellow,
    blue,
    green,
    purple,
    orange,
    gray,
    amber,
  ];

  static UserDtoAvatarColorEnum? fromJson(dynamic value) => UserDtoAvatarColorEnumTypeTransformer().decode(value);

  static List<UserDtoAvatarColorEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserDtoAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserDtoAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserDtoAvatarColorEnum] to String,
/// and [decode] dynamic data back to [UserDtoAvatarColorEnum].
class UserDtoAvatarColorEnumTypeTransformer {
  factory UserDtoAvatarColorEnumTypeTransformer() => _instance ??= const UserDtoAvatarColorEnumTypeTransformer._();

  const UserDtoAvatarColorEnumTypeTransformer._();

  String encode(UserDtoAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UserDtoAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserDtoAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return UserDtoAvatarColorEnum.primary;
        case r'pink': return UserDtoAvatarColorEnum.pink;
        case r'red': return UserDtoAvatarColorEnum.red;
        case r'yellow': return UserDtoAvatarColorEnum.yellow;
        case r'blue': return UserDtoAvatarColorEnum.blue;
        case r'green': return UserDtoAvatarColorEnum.green;
        case r'purple': return UserDtoAvatarColorEnum.purple;
        case r'orange': return UserDtoAvatarColorEnum.orange;
        case r'gray': return UserDtoAvatarColorEnum.gray;
        case r'amber': return UserDtoAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserDtoAvatarColorEnumTypeTransformer] instance.
  static UserDtoAvatarColorEnumTypeTransformer? _instance;
}


