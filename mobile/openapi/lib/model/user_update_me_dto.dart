//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserUpdateMeDto {
  /// Returns a new [UserUpdateMeDto] instance.
  UserUpdateMeDto({
    this.avatarColor,
    this.email,
    this.name,
    this.password,
  });

  UserUpdateMeDtoAvatarColorEnum? avatarColor;

  /// User email
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? email;

  /// User name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  /// User password (deprecated, use change password endpoint)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? password;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserUpdateMeDto &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.name == name &&
    other.password == password;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (email == null ? 0 : email!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (password == null ? 0 : password!.hashCode);

  @override
  String toString() => 'UserUpdateMeDto[avatarColor=$avatarColor, email=$email, name=$name, password=$password]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor != null) {
      json[r'avatarColor'] = this.avatarColor;
    } else {
    //  json[r'avatarColor'] = null;
    }
    if (this.email != null) {
      json[r'email'] = this.email;
    } else {
    //  json[r'email'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
    return json;
  }

  /// Returns a new [UserUpdateMeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserUpdateMeDto? fromJson(dynamic value) {
    upgradeDto(value, "UserUpdateMeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserUpdateMeDto(
        avatarColor: UserUpdateMeDtoAvatarColorEnum.fromJson(json[r'avatarColor']),
        email: mapValueOfType<String>(json, r'email'),
        name: mapValueOfType<String>(json, r'name'),
        password: mapValueOfType<String>(json, r'password'),
      );
    }
    return null;
  }

  static List<UserUpdateMeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserUpdateMeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserUpdateMeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserUpdateMeDto> mapFromJson(dynamic json) {
    final map = <String, UserUpdateMeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserUpdateMeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserUpdateMeDto-objects as value to a dart map
  static Map<String, List<UserUpdateMeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserUpdateMeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserUpdateMeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


class UserUpdateMeDtoAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const UserUpdateMeDtoAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = UserUpdateMeDtoAvatarColorEnum._(r'primary');
  static const pink = UserUpdateMeDtoAvatarColorEnum._(r'pink');
  static const red = UserUpdateMeDtoAvatarColorEnum._(r'red');
  static const yellow = UserUpdateMeDtoAvatarColorEnum._(r'yellow');
  static const blue = UserUpdateMeDtoAvatarColorEnum._(r'blue');
  static const green = UserUpdateMeDtoAvatarColorEnum._(r'green');
  static const purple = UserUpdateMeDtoAvatarColorEnum._(r'purple');
  static const orange = UserUpdateMeDtoAvatarColorEnum._(r'orange');
  static const gray = UserUpdateMeDtoAvatarColorEnum._(r'gray');
  static const amber = UserUpdateMeDtoAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][UserUpdateMeDtoAvatarColorEnum].
  static const values = <UserUpdateMeDtoAvatarColorEnum>[
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

  static UserUpdateMeDtoAvatarColorEnum? fromJson(dynamic value) => UserUpdateMeDtoAvatarColorEnumTypeTransformer().decode(value);

  static List<UserUpdateMeDtoAvatarColorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserUpdateMeDtoAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserUpdateMeDtoAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserUpdateMeDtoAvatarColorEnum] to String,
/// and [decode] dynamic data back to [UserUpdateMeDtoAvatarColorEnum].
class UserUpdateMeDtoAvatarColorEnumTypeTransformer {
  factory UserUpdateMeDtoAvatarColorEnumTypeTransformer() => _instance ??= const UserUpdateMeDtoAvatarColorEnumTypeTransformer._();

  const UserUpdateMeDtoAvatarColorEnumTypeTransformer._();

  String encode(UserUpdateMeDtoAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UserUpdateMeDtoAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserUpdateMeDtoAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return UserUpdateMeDtoAvatarColorEnum.primary;
        case r'pink': return UserUpdateMeDtoAvatarColorEnum.pink;
        case r'red': return UserUpdateMeDtoAvatarColorEnum.red;
        case r'yellow': return UserUpdateMeDtoAvatarColorEnum.yellow;
        case r'blue': return UserUpdateMeDtoAvatarColorEnum.blue;
        case r'green': return UserUpdateMeDtoAvatarColorEnum.green;
        case r'purple': return UserUpdateMeDtoAvatarColorEnum.purple;
        case r'orange': return UserUpdateMeDtoAvatarColorEnum.orange;
        case r'gray': return UserUpdateMeDtoAvatarColorEnum.gray;
        case r'amber': return UserUpdateMeDtoAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserUpdateMeDtoAvatarColorEnumTypeTransformer] instance.
  static UserUpdateMeDtoAvatarColorEnumTypeTransformer? _instance;
}


