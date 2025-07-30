//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GroupAdminUpdateDto {
  /// Returns a new [GroupAdminUpdateDto] instance.
  GroupAdminUpdateDto({
    this.description,
    this.name,
  });

  String? description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GroupAdminUpdateDto &&
    other.description == description &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description == null ? 0 : description!.hashCode) +
    (name == null ? 0 : name!.hashCode);

  @override
  String toString() => 'GroupAdminUpdateDto[description=$description, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    return json;
  }

  /// Returns a new [GroupAdminUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GroupAdminUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "GroupAdminUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GroupAdminUpdateDto(
        description: mapValueOfType<String>(json, r'description'),
        name: mapValueOfType<String>(json, r'name'),
      );
    }
    return null;
  }

  static List<GroupAdminUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GroupAdminUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GroupAdminUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GroupAdminUpdateDto> mapFromJson(dynamic json) {
    final map = <String, GroupAdminUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GroupAdminUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GroupAdminUpdateDto-objects as value to a dart map
  static Map<String, List<GroupAdminUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GroupAdminUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GroupAdminUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

