//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigVideoFrameExtractionDto {
  /// Returns a new [SystemConfigVideoFrameExtractionDto] instance.
  SystemConfigVideoFrameExtractionDto({
    required this.enabled,
    required this.frameInterval,
    required this.qp,
    required this.targetResolution,
  });

  /// Enable video frame extraction
  bool enabled;

  /// Seconds between sampled frames
  ///
  /// Minimum value: 0.01
  double frameInterval;

  /// Fixed quantizer used for the all-intra frame encode
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
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigVideoFrameExtractionDto &&
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
  String toString() => 'SystemConfigVideoFrameExtractionDto[enabled=$enabled, frameInterval=$frameInterval, qp=$qp, targetResolution=$targetResolution]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'frameInterval'] = this.frameInterval;
      json[r'qp'] = this.qp;
      json[r'targetResolution'] = this.targetResolution;
    return json;
  }

  /// Returns a new [SystemConfigVideoFrameExtractionDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigVideoFrameExtractionDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigVideoFrameExtractionDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigVideoFrameExtractionDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        frameInterval: mapValueOfType<double>(json, r'frameInterval')!,
        qp: mapValueOfType<int>(json, r'qp')!,
        targetResolution: mapValueOfType<int>(json, r'targetResolution')!,
      );
    }
    return null;
  }

  static List<SystemConfigVideoFrameExtractionDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigVideoFrameExtractionDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigVideoFrameExtractionDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigVideoFrameExtractionDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigVideoFrameExtractionDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigVideoFrameExtractionDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigVideoFrameExtractionDto-objects as value to a dart map
  static Map<String, List<SystemConfigVideoFrameExtractionDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigVideoFrameExtractionDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigVideoFrameExtractionDto.listFromJson(entry.value, growable: growable,);
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

