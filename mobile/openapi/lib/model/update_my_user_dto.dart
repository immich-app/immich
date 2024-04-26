//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateMyUserDto {
  /// Returns a new [UpdateMyUserDto] instance.
  UpdateMyUserDto({
    this.avatarColor,
    this.email,
    this.memoriesEnabled,
    this.name,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  UserAvatarColor? avatarColor;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? email;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? memoriesEnabled;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateMyUserDto &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.memoriesEnabled == memoriesEnabled &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (email == null ? 0 : email!.hashCode) +
    (memoriesEnabled == null ? 0 : memoriesEnabled!.hashCode) +
    (name == null ? 0 : name!.hashCode);

  @override
  String toString() => 'UpdateMyUserDto[avatarColor=$avatarColor, email=$email, memoriesEnabled=$memoriesEnabled, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor != null) {
      json[r'avatarColor'] = this.avatarColor;
    } else {
    //  json[r'avatarColor'] = null;
    }
    if (this.email != null) {
      json[r'email'] = this.email;
    } else {
    //  json[r'email'] = null;
    }
    if (this.memoriesEnabled != null) {
      json[r'memoriesEnabled'] = this.memoriesEnabled;
    } else {
    //  json[r'memoriesEnabled'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    return json;
  }

  /// Returns a new [UpdateMyUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateMyUserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateMyUserDto(
        avatarColor: UserAvatarColor.fromJson(json[r'avatarColor']),
        email: mapValueOfType<String>(json, r'email'),
        memoriesEnabled: mapValueOfType<bool>(json, r'memoriesEnabled'),
        name: mapValueOfType<String>(json, r'name'),
      );
    }
    return null;
  }

  static List<UpdateMyUserDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateMyUserDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateMyUserDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateMyUserDto> mapFromJson(dynamic json) {
    final map = <String, UpdateMyUserDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateMyUserDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateMyUserDto-objects as value to a dart map
  static Map<String, List<UpdateMyUserDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateMyUserDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateMyUserDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

