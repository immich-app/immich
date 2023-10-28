//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserCommentDto {
  /// Returns a new [UserCommentDto] instance.
  UserCommentDto({
    required this.email,
    required this.firstName,
    required this.id,
    required this.lastName,
    required this.profileImagePath,
  });

  String email;

  String firstName;

  String id;

  String lastName;

  String profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserCommentDto &&
     other.email == email &&
     other.firstName == firstName &&
     other.id == id &&
     other.lastName == lastName &&
     other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email.hashCode) +
    (firstName.hashCode) +
    (id.hashCode) +
    (lastName.hashCode) +
    (profileImagePath.hashCode);

  @override
  String toString() => 'UserCommentDto[email=$email, firstName=$firstName, id=$id, lastName=$lastName, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'email'] = this.email;
      json[r'firstName'] = this.firstName;
      json[r'id'] = this.id;
      json[r'lastName'] = this.lastName;
      json[r'profileImagePath'] = this.profileImagePath;
    return json;
  }

  /// Returns a new [UserCommentDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserCommentDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserCommentDto(
        email: mapValueOfType<String>(json, r'email')!,
        firstName: mapValueOfType<String>(json, r'firstName')!,
        id: mapValueOfType<String>(json, r'id')!,
        lastName: mapValueOfType<String>(json, r'lastName')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
      );
    }
    return null;
  }

  static List<UserCommentDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserCommentDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserCommentDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserCommentDto> mapFromJson(dynamic json) {
    final map = <String, UserCommentDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserCommentDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserCommentDto-objects as value to a dart map
  static Map<String, List<UserCommentDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserCommentDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserCommentDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
    'firstName',
    'id',
    'lastName',
    'profileImagePath',
  };
}

