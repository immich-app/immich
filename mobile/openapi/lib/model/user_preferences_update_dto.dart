//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserPreferencesUpdateDto {
  /// Returns a new [UserPreferencesUpdateDto] instance.
  UserPreferencesUpdateDto({
    this.avatar,
    this.memories,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AvatarUpdate? avatar;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  MemoryUpdate? memories;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserPreferencesUpdateDto &&
    other.avatar == avatar &&
    other.memories == memories;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatar == null ? 0 : avatar!.hashCode) +
    (memories == null ? 0 : memories!.hashCode);

  @override
  String toString() => 'UserPreferencesUpdateDto[avatar=$avatar, memories=$memories]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatar != null) {
      json[r'avatar'] = this.avatar;
    } else {
    //  json[r'avatar'] = null;
    }
    if (this.memories != null) {
      json[r'memories'] = this.memories;
    } else {
    //  json[r'memories'] = null;
    }
    return json;
  }

  /// Returns a new [UserPreferencesUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserPreferencesUpdateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserPreferencesUpdateDto(
        avatar: AvatarUpdate.fromJson(json[r'avatar']),
        memories: MemoryUpdate.fromJson(json[r'memories']),
      );
    }
    return null;
  }

  static List<UserPreferencesUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserPreferencesUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserPreferencesUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserPreferencesUpdateDto> mapFromJson(dynamic json) {
    final map = <String, UserPreferencesUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserPreferencesUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserPreferencesUpdateDto-objects as value to a dart map
  static Map<String, List<UserPreferencesUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserPreferencesUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserPreferencesUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

