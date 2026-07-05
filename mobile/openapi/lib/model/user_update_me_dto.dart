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
    this.avatarColor = const Optional.absent(),
    this.email = const Optional.absent(),
    this.name = const Optional.absent(),
    this.password = const Optional.absent(),
  });

  Optional<UserAvatarColor?> avatarColor;

  /// User email
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> email;

  /// User name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> name;

  /// User password (deprecated, use change password endpoint)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> password;

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
    if (this.avatarColor.isPresent) {
      final value = this.avatarColor.value;
      json[r'avatarColor'] = value;
    }
    if (this.email.isPresent) {
      final value = this.email.value;
      json[r'email'] = value;
    }
    if (this.name.isPresent) {
      final value = this.name.value;
      json[r'name'] = value;
    }
    if (this.password.isPresent) {
      final value = this.password.value;
      json[r'password'] = value;
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
        avatarColor: json.containsKey(r'avatarColor') ? Optional.present(UserAvatarColor.fromJson(json[r'avatarColor'])) : const Optional.absent(),
        email: json.containsKey(r'email') ? Optional.present(mapValueOfType<String>(json, r'email')) : const Optional.absent(),
        name: json.containsKey(r'name') ? Optional.present(mapValueOfType<String>(json, r'name')) : const Optional.absent(),
        password: json.containsKey(r'password') ? Optional.present(mapValueOfType<String>(json, r'password')) : const Optional.absent(),
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

