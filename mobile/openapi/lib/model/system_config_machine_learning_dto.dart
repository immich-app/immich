//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigMachineLearningDto {
  /// Returns a new [SystemConfigMachineLearningDto] instance.
  SystemConfigMachineLearningDto({
    required this.clip,
    required this.duplicateDetection,
    required this.enabled,
    required this.facialRecognition,
    required this.url,
  });

  CLIPConfig clip;

  DuplicateDetectionConfig duplicateDetection;

  bool enabled;

  RecognitionConfig facialRecognition;

  String url;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigMachineLearningDto &&
    other.clip == clip &&
    other.duplicateDetection == duplicateDetection &&
    other.enabled == enabled &&
    other.facialRecognition == facialRecognition &&
    other.url == url;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (clip.hashCode) +
    (duplicateDetection.hashCode) +
    (enabled.hashCode) +
    (facialRecognition.hashCode) +
    (url.hashCode);

  @override
  String toString() => 'SystemConfigMachineLearningDto[clip=$clip, duplicateDetection=$duplicateDetection, enabled=$enabled, facialRecognition=$facialRecognition, url=$url]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'clip'] = this.clip;
      json[r'duplicateDetection'] = this.duplicateDetection;
      json[r'enabled'] = this.enabled;
      json[r'facialRecognition'] = this.facialRecognition;
      json[r'url'] = this.url;
    return json;
  }

  /// Returns a new [SystemConfigMachineLearningDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigMachineLearningDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigMachineLearningDto(
        clip: CLIPConfig.fromJson(json[r'clip'])!,
        duplicateDetection: DuplicateDetectionConfig.fromJson(json[r'duplicateDetection'])!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        facialRecognition: RecognitionConfig.fromJson(json[r'facialRecognition'])!,
        url: mapValueOfType<String>(json, r'url')!,
      );
    }
    return null;
  }

  static List<SystemConfigMachineLearningDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigMachineLearningDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigMachineLearningDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigMachineLearningDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigMachineLearningDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigMachineLearningDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigMachineLearningDto-objects as value to a dart map
  static Map<String, List<SystemConfigMachineLearningDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigMachineLearningDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigMachineLearningDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'clip',
    'duplicateDetection',
    'enabled',
    'facialRecognition',
    'url',
  };
}

