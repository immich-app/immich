//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LoadTextualModelOnConnection {
  /// Returns a new [LoadTextualModelOnConnection] instance.
  LoadTextualModelOnConnection({
    required this.enabled,
    required this.ttl,
  });

  bool enabled;

  /// Minimum value: 0
  num ttl;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LoadTextualModelOnConnection &&
    other.enabled == enabled &&
    other.ttl == ttl;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (ttl.hashCode);

  @override
  String toString() => 'LoadTextualModelOnConnection[enabled=$enabled, ttl=$ttl]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'ttl'] = this.ttl;
    return json;
  }

  /// Returns a new [LoadTextualModelOnConnection] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LoadTextualModelOnConnection? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LoadTextualModelOnConnection(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        ttl: num.parse('${json[r'ttl']}'),
      );
    }
    return null;
  }

  static List<LoadTextualModelOnConnection> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LoadTextualModelOnConnection>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LoadTextualModelOnConnection.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LoadTextualModelOnConnection> mapFromJson(dynamic json) {
    final map = <String, LoadTextualModelOnConnection>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LoadTextualModelOnConnection.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LoadTextualModelOnConnection-objects as value to a dart map
  static Map<String, List<LoadTextualModelOnConnection>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LoadTextualModelOnConnection>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LoadTextualModelOnConnection.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'ttl',
  };
}

