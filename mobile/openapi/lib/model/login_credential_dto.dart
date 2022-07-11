//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LoginCredentialDto {
  /// Returns a new [LoginCredentialDto] instance.
  LoginCredentialDto({
    required this.email,
    required this.password,
  });

  String email;

  String password;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LoginCredentialDto &&
     other.email == email &&
     other.password == password;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email.hashCode) +
    (password.hashCode);

  @override
  String toString() => 'LoginCredentialDto[email=$email, password=$password]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'email'] = email;
      _json[r'password'] = password;
    return _json;
  }

  /// Returns a new [LoginCredentialDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LoginCredentialDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "LoginCredentialDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "LoginCredentialDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return LoginCredentialDto(
        email: mapValueOfType<String>(json, r'email')!,
        password: mapValueOfType<String>(json, r'password')!,
      );
    }
    return null;
  }

  static List<LoginCredentialDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LoginCredentialDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LoginCredentialDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LoginCredentialDto> mapFromJson(dynamic json) {
    final map = <String, LoginCredentialDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LoginCredentialDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LoginCredentialDto-objects as value to a dart map
  static Map<String, List<LoginCredentialDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LoginCredentialDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LoginCredentialDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
    'password',
  };
}

