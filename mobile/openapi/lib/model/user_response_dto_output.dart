//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserResponseDtoOutput {
  /// Returns a new [UserResponseDtoOutput] instance.
  UserResponseDtoOutput({
    required this.avatarColor,
    required this.email,
    required this.id,
    required this.name,
    required this.profileChangedAt,
    required this.profileImagePath,
  });

  /// Avatar color
  UserResponseDtoOutputAvatarColorEnum avatarColor;

  /// User email
  String email;

  /// User ID
  String id;

  /// User name
  String name;

  /// Profile change date
  DateTime profileChangedAt;

  /// Profile image path
  String profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserResponseDtoOutput &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.id == id &&
    other.name == name &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (profileChangedAt.hashCode) +
    (profileImagePath.hashCode);

  @override
  String toString() => 'UserResponseDtoOutput[avatarColor=$avatarColor, email=$email, id=$id, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatarColor'] = this.avatarColor;
      json[r'email'] = this.email;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'profileChangedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.profileChangedAt.millisecondsSinceEpoch
        : this.profileChangedAt.toUtc().toIso8601String();
      json[r'profileImagePath'] = this.profileImagePath;
    return json;
  }

  /// Returns a new [UserResponseDtoOutput] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserResponseDtoOutput? fromJson(dynamic value) {
    upgradeDto(value, "UserResponseDtoOutput");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserResponseDtoOutput(
        avatarColor: UserResponseDtoOutputAvatarColorEnum.fromJson(json[r'avatarColor'])!,
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
      );
    }
    return null;
  }

  static List<UserResponseDtoOutput> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserResponseDtoOutput>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserResponseDtoOutput.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserResponseDtoOutput> mapFromJson(dynamic json) {
    final map = <String, UserResponseDtoOutput>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserResponseDtoOutput.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserResponseDtoOutput-objects as value to a dart map
  static Map<String, List<UserResponseDtoOutput>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserResponseDtoOutput>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserResponseDtoOutput.listFromJson(entry.value, growable: growable,);
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
    'profileChangedAt',
    'profileImagePath',
  };
}

/// Avatar color
class UserResponseDtoOutputAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const UserResponseDtoOutputAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = UserResponseDtoOutputAvatarColorEnum._(r'primary');
  static const pink = UserResponseDtoOutputAvatarColorEnum._(r'pink');
  static const red = UserResponseDtoOutputAvatarColorEnum._(r'red');
  static const yellow = UserResponseDtoOutputAvatarColorEnum._(r'yellow');
  static const blue = UserResponseDtoOutputAvatarColorEnum._(r'blue');
  static const green = UserResponseDtoOutputAvatarColorEnum._(r'green');
  static const purple = UserResponseDtoOutputAvatarColorEnum._(r'purple');
  static const orange = UserResponseDtoOutputAvatarColorEnum._(r'orange');
  static const gray = UserResponseDtoOutputAvatarColorEnum._(r'gray');
  static const amber = UserResponseDtoOutputAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][UserResponseDtoOutputAvatarColorEnum].
  static const values = <UserResponseDtoOutputAvatarColorEnum>[
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

  static UserResponseDtoOutputAvatarColorEnum? fromJson(dynamic value) => UserResponseDtoOutputAvatarColorEnumTypeTransformer().decode(value);

  static List<UserResponseDtoOutputAvatarColorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserResponseDtoOutputAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserResponseDtoOutputAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserResponseDtoOutputAvatarColorEnum] to String,
/// and [decode] dynamic data back to [UserResponseDtoOutputAvatarColorEnum].
class UserResponseDtoOutputAvatarColorEnumTypeTransformer {
  factory UserResponseDtoOutputAvatarColorEnumTypeTransformer() => _instance ??= const UserResponseDtoOutputAvatarColorEnumTypeTransformer._();

  const UserResponseDtoOutputAvatarColorEnumTypeTransformer._();

  String encode(UserResponseDtoOutputAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UserResponseDtoOutputAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserResponseDtoOutputAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return UserResponseDtoOutputAvatarColorEnum.primary;
        case r'pink': return UserResponseDtoOutputAvatarColorEnum.pink;
        case r'red': return UserResponseDtoOutputAvatarColorEnum.red;
        case r'yellow': return UserResponseDtoOutputAvatarColorEnum.yellow;
        case r'blue': return UserResponseDtoOutputAvatarColorEnum.blue;
        case r'green': return UserResponseDtoOutputAvatarColorEnum.green;
        case r'purple': return UserResponseDtoOutputAvatarColorEnum.purple;
        case r'orange': return UserResponseDtoOutputAvatarColorEnum.orange;
        case r'gray': return UserResponseDtoOutputAvatarColorEnum.gray;
        case r'amber': return UserResponseDtoOutputAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserResponseDtoOutputAvatarColorEnumTypeTransformer] instance.
  static UserResponseDtoOutputAvatarColorEnumTypeTransformer? _instance;
}


