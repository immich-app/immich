//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserDto {
  /// Returns a new [UserDto] instance.
  UserDto({
    required this.email,
    this.firstname,
    required this.id,
    this.lastname,
    required this.name,
    required this.profileImagePath,
  });

  String email;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? firstname;

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? lastname;

  String name;

  String profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserDto &&
     other.email == email &&
     other.firstname == firstname &&
     other.id == id &&
     other.lastname == lastname &&
     other.name == name &&
     other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email.hashCode) +
    (firstname == null ? 0 : firstname!.hashCode) +
    (id.hashCode) +
    (lastname == null ? 0 : lastname!.hashCode) +
    (name.hashCode) +
    (profileImagePath.hashCode);

  @override
  String toString() => 'UserDto[email=$email, firstname=$firstname, id=$id, lastname=$lastname, name=$name, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'email'] = this.email;
    if (this.firstname != null) {
      json[r'firstname'] = this.firstname;
    } else {
    //  json[r'firstname'] = null;
    }
      json[r'id'] = this.id;
    if (this.lastname != null) {
      json[r'lastname'] = this.lastname;
    } else {
    //  json[r'lastname'] = null;
    }
      json[r'name'] = this.name;
      json[r'profileImagePath'] = this.profileImagePath;
    return json;
  }

  /// Returns a new [UserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserDto(
        email: mapValueOfType<String>(json, r'email')!,
        firstname: mapValueOfType<String>(json, r'firstname'),
        id: mapValueOfType<String>(json, r'id')!,
        lastname: mapValueOfType<String>(json, r'lastname'),
        name: mapValueOfType<String>(json, r'name')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
      );
    }
    return null;
  }

  static List<UserDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserDto> mapFromJson(dynamic json) {
    final map = <String, UserDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserDto-objects as value to a dart map
  static Map<String, List<UserDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
    'id',
    'name',
    'profileImagePath',
  };
}

