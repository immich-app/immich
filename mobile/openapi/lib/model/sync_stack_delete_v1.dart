//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncStackDeleteV1 {
  /// Returns a new [SyncStackDeleteV1] instance.
  SyncStackDeleteV1({
    required this.stackId,
  });

  String stackId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncStackDeleteV1 &&
    other.stackId == stackId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (stackId.hashCode);

  @override
  String toString() => 'SyncStackDeleteV1[stackId=$stackId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'stackId'] = this.stackId;
    return json;
  }

  /// Returns a new [SyncStackDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncStackDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncStackDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncStackDeleteV1(
        stackId: mapValueOfType<String>(json, r'stackId')!,
      );
    }
    return null;
  }

  static List<SyncStackDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncStackDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncStackDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncStackDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncStackDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncStackDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncStackDeleteV1-objects as value to a dart map
  static Map<String, List<SyncStackDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncStackDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncStackDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'stackId',
  };
}

