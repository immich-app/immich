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
    this.email,
    this.name,
    this.password,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? email;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? password;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserUpdateMeDto &&
    other.email == email &&
    other.name == name &&
    other.password == password;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email == null ? 0 : email!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (password == null ? 0 : password!.hashCode);

  @override
  String toString() => 'UserUpdateMeDto[email=$email, name=$name, password=$password]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
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

