//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RotateParameters {
  /// Returns a new [RotateParameters] instance.
  RotateParameters({
    required this.angle,
  });

  /// Rotation angle in degrees
  num angle;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RotateParameters &&
    other.angle == angle;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (angle.hashCode);

  @override
  String toString() => 'RotateParameters[angle=$angle]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'angle'] = this.angle;
    return json;
  }

  /// Returns a new [RotateParameters] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RotateParameters? fromJson(dynamic value) {
    upgradeDto(value, "RotateParameters");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RotateParameters(
        angle: num.parse('${json[r'angle']}'),
      );
    }
    return null;
  }

  static List<RotateParameters> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RotateParameters>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RotateParameters.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RotateParameters> mapFromJson(dynamic json) {
    final map = <String, RotateParameters>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RotateParameters.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RotateParameters-objects as value to a dart map
  static Map<String, List<RotateParameters>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RotateParameters>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RotateParameters.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'angle',
  };
}

