//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SignUpDto {
  /// Returns a new [SignUpDto] instance.
  SignUpDto({
    required this.email,
    required this.name,
    required this.password,
  });

  String email;

  String name;

  String password;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SignUpDto &&
    other.email == email &&
    other.name == name &&
    other.password == password;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email.hashCode) +
    (name.hashCode) +
    (password.hashCode);

  @override
  String toString() => 'SignUpDto[email=$email, name=$name, password=$password]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'email'] = this.email;
      json[r'name'] = this.name;
      json[r'password'] = this.password;
    return json;
  }

  /// Returns a new [SignUpDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SignUpDto? fromJson(dynamic value) {
    upgradeDto(value, "SignUpDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SignUpDto(
        email: mapValueOfType<String>(json, r'email')!,
        name: mapValueOfType<String>(json, r'name')!,
        password: mapValueOfType<String>(json, r'password')!,
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
    'name',
    'password',
  };
}

