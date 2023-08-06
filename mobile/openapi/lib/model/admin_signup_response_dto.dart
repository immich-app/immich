//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AdminSignupResponseDto {
  /// Returns a new [AdminSignupResponseDto] instance.
  AdminSignupResponseDto({
    required this.createdAt,
    required this.email,
    required this.firstName,
    required this.id,
    required this.lastName,
  });

  DateTime createdAt;

  String email;

  String firstName;

  String id;

  String lastName;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AdminSignupResponseDto &&
    other.createdAt == createdAt &&
    other.email == email &&
    other.firstName == firstName &&
    other.id == id &&
    other.lastName == lastName;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (email.hashCode) +
    (firstName.hashCode) +
    (id.hashCode) +
    (lastName.hashCode);

  @override
  String toString() => 'AdminSignupResponseDto[createdAt=$createdAt, email=$email, firstName=$firstName, id=$id, lastName=$lastName]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'email'] = this.email;
      json[r'firstName'] = this.firstName;
      json[r'id'] = this.id;
      json[r'lastName'] = this.lastName;
    return json;
  }

  /// Returns a new [AdminSignupResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AdminSignupResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AdminSignupResponseDto(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        email: mapValueOfType<String>(json, r'email')!,
        firstName: mapValueOfType<String>(json, r'firstName')!,
        id: mapValueOfType<String>(json, r'id')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
      );
    }
    return null;
  }

  static List<AdminSignupResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AdminSignupResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AdminSignupResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AdminSignupResponseDto> mapFromJson(dynamic json) {
    final map = <String, AdminSignupResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AdminSignupResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AdminSignupResponseDto-objects as value to a dart map
  static Map<String, List<AdminSignupResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AdminSignupResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AdminSignupResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'email',
    'firstName',
    'id',
    'lastName',
  };
}

