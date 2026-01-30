//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MirrorParameters {
  /// Returns a new [MirrorParameters] instance.
  MirrorParameters({
    required this.axis,
  });

  /// Axis to mirror along
  MirrorAxis axis;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MirrorParameters &&
    other.axis == axis;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (axis.hashCode);

  @override
  String toString() => 'MirrorParameters[axis=$axis]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'axis'] = this.axis;
    return json;
  }

  /// Returns a new [MirrorParameters] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MirrorParameters? fromJson(dynamic value) {
    upgradeDto(value, "MirrorParameters");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MirrorParameters(
        axis: MirrorAxis.fromJson(json[r'axis'])!,
      );
    }
    return null;
  }

  static List<MirrorParameters> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MirrorParameters>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MirrorParameters.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MirrorParameters> mapFromJson(dynamic json) {
    final map = <String, MirrorParameters>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MirrorParameters.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MirrorParameters-objects as value to a dart map
  static Map<String, List<MirrorParameters>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MirrorParameters>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MirrorParameters.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'axis',
  };
}

