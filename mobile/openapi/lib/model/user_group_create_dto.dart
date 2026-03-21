//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserGroupCreateDto {
  /// Returns a new [UserGroupCreateDto] instance.
  UserGroupCreateDto({
    this.color,
    required this.name,
  });

  /// Group color
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  UserAvatarColor? color;

  /// Group name
  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserGroupCreateDto &&
    other.color == color &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (color == null ? 0 : color!.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'UserGroupCreateDto[color=$color, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [UserGroupCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserGroupCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "UserGroupCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserGroupCreateDto(
        color: UserAvatarColor.fromJson(json[r'color']),
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<UserGroupCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserGroupCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserGroupCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserGroupCreateDto> mapFromJson(dynamic json) {
    final map = <String, UserGroupCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserGroupCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserGroupCreateDto-objects as value to a dart map
  static Map<String, List<UserGroupCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserGroupCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserGroupCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
  };
}

