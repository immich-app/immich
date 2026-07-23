//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IdFilter {
  /// Returns a new [IdFilter] instance.
  IdFilter({
    this.eq = const Optional.absent(),
    this.ne = const Optional.absent(),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> eq;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> ne;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IdFilter &&
    other.eq == eq &&
    other.ne == ne;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (eq == null ? 0 : eq!.hashCode) +
    (ne == null ? 0 : ne!.hashCode);

  @override
  String toString() => 'IdFilter[eq=$eq, ne=$ne]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.eq.isPresent) {
      final value = this.eq.value;
      json[r'eq'] = value;
    }
    if (this.ne.isPresent) {
      final value = this.ne.value;
      json[r'ne'] = value;
    }
    return json;
  }

  /// Returns a new [IdFilter] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IdFilter? fromJson(dynamic value) {
    upgradeDto(value, "IdFilter");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return IdFilter(
        eq: json.containsKey(r'eq') ? Optional.present(mapValueOfType<String>(json, r'eq')) : const Optional.absent(),
        ne: json.containsKey(r'ne') ? Optional.present(mapValueOfType<String>(json, r'ne')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<IdFilter> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IdFilter>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IdFilter.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IdFilter> mapFromJson(dynamic json) {
    final map = <String, IdFilter>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IdFilter.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IdFilter-objects as value to a dart map
  static Map<String, List<IdFilter>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IdFilter>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IdFilter.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

