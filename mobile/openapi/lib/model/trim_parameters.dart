//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TrimParameters {
  /// Returns a new [TrimParameters] instance.
  TrimParameters({
    required this.endTime,
    required this.startTime,
  });

  /// End time in seconds
  ///
  /// Minimum value: 0
  num endTime;

  /// Start time in seconds
  ///
  /// Minimum value: 0
  num startTime;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TrimParameters &&
    other.endTime == endTime &&
    other.startTime == startTime;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (endTime.hashCode) +
    (startTime.hashCode);

  @override
  String toString() => 'TrimParameters[endTime=$endTime, startTime=$startTime]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'endTime'] = this.endTime;
      json[r'startTime'] = this.startTime;
    return json;
  }

  /// Returns a new [TrimParameters] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TrimParameters? fromJson(dynamic value) {
    upgradeDto(value, "TrimParameters");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TrimParameters(
        endTime: num.parse('${json[r'endTime']}'),
        startTime: num.parse('${json[r'startTime']}'),
      );
    }
    return null;
  }

  static List<TrimParameters> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TrimParameters>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TrimParameters.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TrimParameters> mapFromJson(dynamic json) {
    final map = <String, TrimParameters>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TrimParameters.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TrimParameters-objects as value to a dart map
  static Map<String, List<TrimParameters>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TrimParameters>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TrimParameters.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'endTime',
    'startTime',
  };
}

