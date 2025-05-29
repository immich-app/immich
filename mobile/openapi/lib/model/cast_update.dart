//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CastUpdate {
  /// Returns a new [CastUpdate] instance.
  CastUpdate({
    this.gCastEnabled,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? gCastEnabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CastUpdate &&
    other.gCastEnabled == gCastEnabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (gCastEnabled == null ? 0 : gCastEnabled!.hashCode);

  @override
  String toString() => 'CastUpdate[gCastEnabled=$gCastEnabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.gCastEnabled != null) {
      json[r'gCastEnabled'] = this.gCastEnabled;
    } else {
    //  json[r'gCastEnabled'] = null;
    }
    return json;
  }

  /// Returns a new [CastUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CastUpdate? fromJson(dynamic value) {
    upgradeDto(value, "CastUpdate");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CastUpdate(
        gCastEnabled: mapValueOfType<bool>(json, r'gCastEnabled'),
      );
    }
    return null;
  }

  static List<CastUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CastUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CastUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CastUpdate> mapFromJson(dynamic json) {
    final map = <String, CastUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CastUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CastUpdate-objects as value to a dart map
  static Map<String, List<CastUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CastUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CastUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

