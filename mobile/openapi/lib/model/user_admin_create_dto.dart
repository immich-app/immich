//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserAdminCreateDto {
  /// Returns a new [UserAdminCreateDto] instance.
  UserAdminCreateDto({
    this.avatarColor,
    required this.email,
    this.isAdmin,
    required this.name,
    this.notify,
    required this.password,
    this.pinCode,
    this.quotaSizeInBytes,
    this.shouldChangePassword,
    this.storageLabel,
  });

  UserAdminCreateDtoAvatarColorEnum? avatarColor;

  /// User email
  String email;

  /// Grant admin privileges
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isAdmin;

  /// User name
  String name;

  /// Send notification email
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? notify;

  /// User password
  String password;

  /// PIN code
  String? pinCode;

  /// Storage quota in bytes
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int? quotaSizeInBytes;

  /// Require password change on next login
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? shouldChangePassword;

  /// Storage label
  String? storageLabel;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserAdminCreateDto &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.isAdmin == isAdmin &&
    other.name == name &&
    other.notify == notify &&
    other.password == password &&
    other.pinCode == pinCode &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.shouldChangePassword == shouldChangePassword &&
    other.storageLabel == storageLabel;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (email.hashCode) +
    (isAdmin == null ? 0 : isAdmin!.hashCode) +
    (name.hashCode) +
    (notify == null ? 0 : notify!.hashCode) +
    (password.hashCode) +
    (pinCode == null ? 0 : pinCode!.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (shouldChangePassword == null ? 0 : shouldChangePassword!.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode);

  @override
  String toString() => 'UserAdminCreateDto[avatarColor=$avatarColor, email=$email, isAdmin=$isAdmin, name=$name, notify=$notify, password=$password, pinCode=$pinCode, quotaSizeInBytes=$quotaSizeInBytes, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor != null) {
      json[r'avatarColor'] = this.avatarColor;
    } else {
    //  json[r'avatarColor'] = null;
    }
      json[r'email'] = this.email;
    if (this.isAdmin != null) {
      json[r'isAdmin'] = this.isAdmin;
    } else {
    //  json[r'isAdmin'] = null;
    }
      json[r'name'] = this.name;
    if (this.notify != null) {
      json[r'notify'] = this.notify;
    } else {
    //  json[r'notify'] = null;
    }
      json[r'password'] = this.password;
    if (this.pinCode != null) {
      json[r'pinCode'] = this.pinCode;
    } else {
    //  json[r'pinCode'] = null;
    }
    if (this.quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = this.quotaSizeInBytes;
    } else {
    //  json[r'quotaSizeInBytes'] = null;
    }
    if (this.shouldChangePassword != null) {
      json[r'shouldChangePassword'] = this.shouldChangePassword;
    } else {
    //  json[r'shouldChangePassword'] = null;
    }
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
    return json;
  }

  /// Returns a new [UserAdminCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserAdminCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "UserAdminCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserAdminCreateDto(
        avatarColor: UserAdminCreateDtoAvatarColorEnum.fromJson(json[r'avatarColor']),
        email: mapValueOfType<String>(json, r'email')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin'),
        name: mapValueOfType<String>(json, r'name')!,
        notify: mapValueOfType<bool>(json, r'notify'),
        password: mapValueOfType<String>(json, r'password')!,
        pinCode: mapValueOfType<String>(json, r'pinCode'),
        quotaSizeInBytes: mapValueOfType<int>(json, r'quotaSizeInBytes'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword'),
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
      );
    }
    return null;
  }

  static List<UserAdminCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserAdminCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserAdminCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserAdminCreateDto> mapFromJson(dynamic json) {
    final map = <String, UserAdminCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserAdminCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserAdminCreateDto-objects as value to a dart map
  static Map<String, List<UserAdminCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserAdminCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserAdminCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
    'name',
    'password',
  };
}


class UserAdminCreateDtoAvatarColorEnum {
  /// Instantiate a new enum with the provided [value].
  const UserAdminCreateDtoAvatarColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = UserAdminCreateDtoAvatarColorEnum._(r'primary');
  static const pink = UserAdminCreateDtoAvatarColorEnum._(r'pink');
  static const red = UserAdminCreateDtoAvatarColorEnum._(r'red');
  static const yellow = UserAdminCreateDtoAvatarColorEnum._(r'yellow');
  static const blue = UserAdminCreateDtoAvatarColorEnum._(r'blue');
  static const green = UserAdminCreateDtoAvatarColorEnum._(r'green');
  static const purple = UserAdminCreateDtoAvatarColorEnum._(r'purple');
  static const orange = UserAdminCreateDtoAvatarColorEnum._(r'orange');
  static const gray = UserAdminCreateDtoAvatarColorEnum._(r'gray');
  static const amber = UserAdminCreateDtoAvatarColorEnum._(r'amber');

  /// List of all possible values in this [enum][UserAdminCreateDtoAvatarColorEnum].
  static const values = <UserAdminCreateDtoAvatarColorEnum>[
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

  static UserAdminCreateDtoAvatarColorEnum? fromJson(dynamic value) => UserAdminCreateDtoAvatarColorEnumTypeTransformer().decode(value);

  static List<UserAdminCreateDtoAvatarColorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserAdminCreateDtoAvatarColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserAdminCreateDtoAvatarColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UserAdminCreateDtoAvatarColorEnum] to String,
/// and [decode] dynamic data back to [UserAdminCreateDtoAvatarColorEnum].
class UserAdminCreateDtoAvatarColorEnumTypeTransformer {
  factory UserAdminCreateDtoAvatarColorEnumTypeTransformer() => _instance ??= const UserAdminCreateDtoAvatarColorEnumTypeTransformer._();

  const UserAdminCreateDtoAvatarColorEnumTypeTransformer._();

  String encode(UserAdminCreateDtoAvatarColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UserAdminCreateDtoAvatarColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UserAdminCreateDtoAvatarColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return UserAdminCreateDtoAvatarColorEnum.primary;
        case r'pink': return UserAdminCreateDtoAvatarColorEnum.pink;
        case r'red': return UserAdminCreateDtoAvatarColorEnum.red;
        case r'yellow': return UserAdminCreateDtoAvatarColorEnum.yellow;
        case r'blue': return UserAdminCreateDtoAvatarColorEnum.blue;
        case r'green': return UserAdminCreateDtoAvatarColorEnum.green;
        case r'purple': return UserAdminCreateDtoAvatarColorEnum.purple;
        case r'orange': return UserAdminCreateDtoAvatarColorEnum.orange;
        case r'gray': return UserAdminCreateDtoAvatarColorEnum.gray;
        case r'amber': return UserAdminCreateDtoAvatarColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UserAdminCreateDtoAvatarColorEnumTypeTransformer] instance.
  static UserAdminCreateDtoAvatarColorEnumTypeTransformer? _instance;
}


