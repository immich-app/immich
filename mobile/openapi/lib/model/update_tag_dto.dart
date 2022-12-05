//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateTagDto {
  /// Returns a new [UpdateTagDto] instance.
  UpdateTagDto({
    this.name,
    this.renameTagId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? renameTagId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateTagDto &&
     other.name == name &&
     other.renameTagId == renameTagId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name == null ? 0 : name!.hashCode) +
    (renameTagId == null ? 0 : renameTagId!.hashCode);

  @override
  String toString() => 'UpdateTagDto[name=$name, renameTagId=$renameTagId]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
    if (name != null) {
      _json[r'name'] = name;
    } else {
      _json[r'name'] = null;
    }
    if (renameTagId != null) {
      _json[r'renameTagId'] = renameTagId;
    } else {
      _json[r'renameTagId'] = null;
    }
    return _json;
  }

  /// Returns a new [UpdateTagDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateTagDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UpdateTagDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UpdateTagDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UpdateTagDto(
        name: mapValueOfType<String>(json, r'name'),
        renameTagId: mapValueOfType<String>(json, r'renameTagId'),
      );
    }
    return null;
  }

  static List<UpdateTagDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateTagDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateTagDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateTagDto> mapFromJson(dynamic json) {
    final map = <String, UpdateTagDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateTagDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateTagDto-objects as value to a dart map
  static Map<String, List<UpdateTagDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateTagDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateTagDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

