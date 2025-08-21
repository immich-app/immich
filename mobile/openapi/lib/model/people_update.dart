//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleUpdate {
  /// Returns a new [PeopleUpdate] instance.
  PeopleUpdate({
    this.enabled,
    this.sidebarWeb,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? enabled;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? sidebarWeb;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleUpdate &&
    other.enabled == enabled &&
    other.sidebarWeb == sidebarWeb;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled == null ? 0 : enabled!.hashCode) +
    (sidebarWeb == null ? 0 : sidebarWeb!.hashCode);

  @override
  String toString() => 'PeopleUpdate[enabled=$enabled, sidebarWeb=$sidebarWeb]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.enabled != null) {
      json[r'enabled'] = this.enabled;
    } else {
    //  json[r'enabled'] = null;
    }
    if (this.sidebarWeb != null) {
      json[r'sidebarWeb'] = this.sidebarWeb;
    } else {
    //  json[r'sidebarWeb'] = null;
    }
    return json;
  }

  /// Returns a new [PeopleUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleUpdate? fromJson(dynamic value) {
    upgradeDto(value, "PeopleUpdate");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleUpdate(
        enabled: mapValueOfType<bool>(json, r'enabled'),
        sidebarWeb: mapValueOfType<bool>(json, r'sidebarWeb'),
      );
    }
    return null;
  }

  static List<PeopleUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleUpdate> mapFromJson(dynamic json) {
    final map = <String, PeopleUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleUpdate-objects as value to a dart map
  static Map<String, List<PeopleUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

