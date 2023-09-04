//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateUserDto {
  /// Returns a new [CreateUserDto] instance.
  CreateUserDto({
    required this.email,
    this.externalPath,
    required this.firstName,
    required this.lastName,
    this.memoriesEnabled,
    required this.password,
    this.storageLabel,
  });

  String email;

  String? externalPath;

  String firstName;

  String lastName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? memoriesEnabled;

  String password;

  String? storageLabel;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateUserDto &&
     other.email == email &&
     other.externalPath == externalPath &&
     other.firstName == firstName &&
     other.lastName == lastName &&
     other.memoriesEnabled == memoriesEnabled &&
     other.password == password &&
     other.storageLabel == storageLabel;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email.hashCode) +
    (externalPath == null ? 0 : externalPath!.hashCode) +
    (firstName.hashCode) +
    (lastName.hashCode) +
    (memoriesEnabled == null ? 0 : memoriesEnabled!.hashCode) +
    (password.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode);

  @override
  String toString() => 'CreateUserDto[email=$email, externalPath=$externalPath, firstName=$firstName, lastName=$lastName, memoriesEnabled=$memoriesEnabled, password=$password, storageLabel=$storageLabel]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'email'] = this.email;
    if (this.externalPath != null) {
      json[r'externalPath'] = this.externalPath;
    } else {
    //  json[r'externalPath'] = null;
    }
      json[r'firstName'] = this.firstName;
      json[r'lastName'] = this.lastName;
    if (this.memoriesEnabled != null) {
      json[r'memoriesEnabled'] = this.memoriesEnabled;
    } else {
    //  json[r'memoriesEnabled'] = null;
    }
      json[r'password'] = this.password;
    if (this.storageLabel != null) {
      json[r'storageLabel'] = this.storageLabel;
    } else {
    //  json[r'storageLabel'] = null;
    }
    return json;
  }

  /// Returns a new [CreateUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateUserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateUserDto(
        email: mapValueOfType<String>(json, r'email')!,
        externalPath: mapValueOfType<String>(json, r'externalPath'),
        firstName: mapValueOfType<String>(json, r'firstName')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
        memoriesEnabled: mapValueOfType<bool>(json, r'memoriesEnabled'),
        password: mapValueOfType<String>(json, r'password')!,
        storageLabel: mapValueOfType<String>(json, r'storageLabel'),
      );
    }
    return null;
  }

  static List<CreateUserDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateUserDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateUserDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateUserDto> mapFromJson(dynamic json) {
    final map = <String, CreateUserDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateUserDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateUserDto-objects as value to a dart map
  static Map<String, List<CreateUserDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateUserDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateUserDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
    'firstName',
    'lastName',
    'password',
  };
}

