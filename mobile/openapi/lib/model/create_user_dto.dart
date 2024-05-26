//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateUserDto {
  /// Returns a new [CreateUserDto] instance.
  CreateUserDto({
    required this.email,
    this.memoriesEnabled,
    required this.name,
    this.notify,
    required this.password,
    this.quotaSizeInBytes,
    this.shouldChangePassword,
    this.storageLabel,
  });

  String email;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? memoriesEnabled;

  String name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? notify;

  String password;

  /// Minimum value: 1
  int? quotaSizeInBytes;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? shouldChangePassword;

  String? storageLabel;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateUserDto &&
    other.email == email &&
    other.memoriesEnabled == memoriesEnabled &&
    other.name == name &&
    other.notify == notify &&
    other.password == password &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.shouldChangePassword == shouldChangePassword &&
    other.storageLabel == storageLabel;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email.hashCode) +
    (memoriesEnabled == null ? 0 : memoriesEnabled!.hashCode) +
    (name.hashCode) +
    (notify == null ? 0 : notify!.hashCode) +
    (password.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (shouldChangePassword == null ? 0 : shouldChangePassword!.hashCode) +
    (storageLabel == null ? 0 : storageLabel!.hashCode);

  @override
  String toString() => 'CreateUserDto[email=$email, memoriesEnabled=$memoriesEnabled, name=$name, notify=$notify, password=$password, quotaSizeInBytes=$quotaSizeInBytes, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'email'] = this.email;
    if (this.memoriesEnabled != null) {
      json[r'memoriesEnabled'] = this.memoriesEnabled;
    } else {
    //  json[r'memoriesEnabled'] = null;
    }
      json[r'name'] = this.name;
    if (this.notify != null) {
      json[r'notify'] = this.notify;
    } else {
    //  json[r'notify'] = null;
    }
      json[r'password'] = this.password;
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

  /// Returns a new [CreateUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateUserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateUserDto(
        email: mapValueOfType<String>(json, r'email')!,
        memoriesEnabled: mapValueOfType<bool>(json, r'memoriesEnabled'),
        name: mapValueOfType<String>(json, r'name')!,
        notify: mapValueOfType<bool>(json, r'notify'),
        password: mapValueOfType<String>(json, r'password')!,
        quotaSizeInBytes: mapValueOfType<int>(json, r'quotaSizeInBytes'),
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword'),
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
    'name',
    'password',
  };
}

