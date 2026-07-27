//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigFrameSamplingDto {
  /// Returns a new [SystemConfigFrameSamplingDto] instance.
  SystemConfigFrameSamplingDto({
    required this.enabled,
    required this.frameInterval,
    required this.qp,
    required this.targetResolution,
  });

  /// Enable frame sampling
  bool enabled;

  /// Seconds between sampled frames
  ///
  /// Minimum value: 0.01
  double frameInterval;

  /// Target quality (CRF-equivalent) used for the all-intra frame encode
  ///
  /// Minimum value: 0
  /// Maximum value: 51
  int qp;

  /// Target short-side resolution (px) of extracted frames
  ///
  /// Minimum value: 1
  /// Maximum value: 9007199254740991
  int targetResolution;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigFrameSamplingDto &&
    other.enabled == enabled &&
    other.frameInterval == frameInterval &&
    other.qp == qp &&
    other.targetResolution == targetResolution;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (frameInterval.hashCode) +
    (qp.hashCode) +
    (targetResolution.hashCode);

  @override
  String toString() => 'SystemConfigFrameSamplingDto[enabled=$enabled, frameInterval=$frameInterval, qp=$qp, targetResolution=$targetResolution]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'frameInterval'] = this.frameInterval;
      json[r'qp'] = this.qp;
      json[r'targetResolution'] = this.targetResolution;
    return json;
  }

  /// Returns a new [SystemConfigFrameSamplingDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigFrameSamplingDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigFrameSamplingDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigFrameSamplingDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        frameInterval: mapValueOfType<double>(json, r'frameInterval')!,
        qp: mapValueOfType<int>(json, r'qp')!,
        targetResolution: mapValueOfType<int>(json, r'targetResolution')!,
      );
    }
    return null;
  }

  static List<SystemConfigFrameSamplingDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigFrameSamplingDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigFrameSamplingDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigFrameSamplingDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigFrameSamplingDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigFrameSamplingDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigFrameSamplingDto-objects as value to a dart map
  static Map<String, List<SystemConfigFrameSamplingDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigFrameSamplingDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigFrameSamplingDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'frameInterval',
    'qp',
    'targetResolution',
  };
}

