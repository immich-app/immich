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
    this.avatarColor = const Optional.absent(),
    required this.email,
    this.isAdmin = const Optional.absent(),
    required this.name,
    this.notify = const Optional.absent(),
    required this.password,
    this.pinCode = const Optional.absent(),
    this.quotaSizeInBytes = const Optional.absent(),
    this.shouldChangePassword = const Optional.absent(),
    this.storageLabel = const Optional.absent(),
  });

  Optional<UserAvatarColor?> avatarColor;

  /// User email
  String email;

  /// Grant admin privileges
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isAdmin;

  /// User name
  String name;

  /// Send notification email
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> notify;

  /// User password
  String password;

  /// PIN code
  Optional<String?> pinCode;

  /// Storage quota in bytes
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  Optional<int?> quotaSizeInBytes;

  /// Require password change on next login
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> shouldChangePassword;

  /// Storage label
  Optional<String?> storageLabel;

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
    if (this.avatarColor.isPresent) {
      final value = this.avatarColor.value;
      json[r'avatarColor'] = value;
    }
      json[r'email'] = this.email;
    if (this.isAdmin.isPresent) {
      final value = this.isAdmin.value;
      json[r'isAdmin'] = value;
    }
      json[r'name'] = this.name;
    if (this.notify.isPresent) {
      final value = this.notify.value;
      json[r'notify'] = value;
    }
      json[r'password'] = this.password;
    if (this.pinCode.isPresent) {
      final value = this.pinCode.value;
      json[r'pinCode'] = value;
    }
    if (this.quotaSizeInBytes.isPresent) {
      final value = this.quotaSizeInBytes.value;
      json[r'quotaSizeInBytes'] = value;
    }
    if (this.shouldChangePassword.isPresent) {
      final value = this.shouldChangePassword.value;
      json[r'shouldChangePassword'] = value;
    }
    if (this.storageLabel.isPresent) {
      final value = this.storageLabel.value;
      json[r'storageLabel'] = value;
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
        avatarColor: json.containsKey(r'avatarColor') ? Optional.present(UserAvatarColor.fromJson(json[r'avatarColor'])) : const Optional.absent(),
        email: mapValueOfType<String>(json, r'email')!,
        isAdmin: json.containsKey(r'isAdmin') ? Optional.present(mapValueOfType<bool>(json, r'isAdmin')) : const Optional.absent(),
        name: mapValueOfType<String>(json, r'name')!,
        notify: json.containsKey(r'notify') ? Optional.present(mapValueOfType<bool>(json, r'notify')) : const Optional.absent(),
        password: mapValueOfType<String>(json, r'password')!,
        pinCode: json.containsKey(r'pinCode') ? Optional.present(mapValueOfType<String>(json, r'pinCode')) : const Optional.absent(),
        quotaSizeInBytes: json.containsKey(r'quotaSizeInBytes') ? Optional.present(json[r'quotaSizeInBytes'] == null ? null : int.parse('${json[r'quotaSizeInBytes']}')) : const Optional.absent(),
        shouldChangePassword: json.containsKey(r'shouldChangePassword') ? Optional.present(mapValueOfType<bool>(json, r'shouldChangePassword')) : const Optional.absent(),
        storageLabel: json.containsKey(r'storageLabel') ? Optional.present(mapValueOfType<String>(json, r'storageLabel')) : const Optional.absent(),
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

