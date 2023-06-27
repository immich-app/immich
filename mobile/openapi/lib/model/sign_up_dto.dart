//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SignUpDto {
  /// Returns a new [SignUpDto] instance.
  SignUpDto({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
  });

  String email;

  String password;

  String firstName;

  String lastName;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SignUpDto &&
     other.email == email &&
     other.password == password &&
     other.firstName == firstName &&
     other.lastName == lastName;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email.hashCode) +
    (password.hashCode) +
    (firstName.hashCode) +
    (lastName.hashCode);

  @override
  String toString() => 'SignUpDto[email=$email, password=$password, firstName=$firstName, lastName=$lastName]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'email'] = this.email;
      json[r'password'] = this.password;
      json[r'firstName'] = this.firstName;
      json[r'lastName'] = this.lastName;
    return json;
  }

  /// Returns a new [SignUpDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SignUpDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SignUpDto(
        email: mapValueOfType<String>(json, r'email')!,
        password: mapValueOfType<String>(json, r'password')!,
        firstName: mapValueOfType<String>(json, r'firstName')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
      );
    }
    return null;
  }

  static List<SignUpDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SignUpDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SignUpDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SignUpDto> mapFromJson(dynamic json) {
    final map = <String, SignUpDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SignUpDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SignUpDto-objects as value to a dart map
  static Map<String, List<SignUpDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SignUpDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SignUpDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
    'password',
    'firstName',
    'lastName',
  };
}

