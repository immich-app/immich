//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateTrashDto {
  /// Returns a new [UpdateTrashDto] instance.
  UpdateTrashDto({
    this.deleteAll,
    this.restoreAll,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? deleteAll;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? restoreAll;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateTrashDto &&
     other.deleteAll == deleteAll &&
     other.restoreAll == restoreAll;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deleteAll == null ? 0 : deleteAll!.hashCode) +
    (restoreAll == null ? 0 : restoreAll!.hashCode);

  @override
  String toString() => 'UpdateTrashDto[deleteAll=$deleteAll, restoreAll=$restoreAll]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.deleteAll != null) {
      json[r'deleteAll'] = this.deleteAll;
    } else {
    //  json[r'deleteAll'] = null;
    }
    if (this.restoreAll != null) {
      json[r'restoreAll'] = this.restoreAll;
    } else {
    //  json[r'restoreAll'] = null;
    }
    return json;
  }

  /// Returns a new [UpdateTrashDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateTrashDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateTrashDto(
        deleteAll: mapValueOfType<bool>(json, r'deleteAll'),
        restoreAll: mapValueOfType<bool>(json, r'restoreAll'),
      );
    }
    return null;
  }

  static List<UpdateTrashDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateTrashDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateTrashDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateTrashDto> mapFromJson(dynamic json) {
    final map = <String, UpdateTrashDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateTrashDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateTrashDto-objects as value to a dart map
  static Map<String, List<UpdateTrashDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateTrashDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateTrashDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

