//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigMachineLearningDto {
  /// Returns a new [SystemConfigMachineLearningDto] instance.
  SystemConfigMachineLearningDto({
    required this.clipEncodeEnabled,
    required this.enabled,
    required this.facialRecognitionEnabled,
    required this.tagImageEnabled,
    required this.url,
  });

  bool clipEncodeEnabled;

  bool enabled;

  bool facialRecognitionEnabled;

  bool tagImageEnabled;

  String url;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigMachineLearningDto &&
     other.clipEncodeEnabled == clipEncodeEnabled &&
     other.enabled == enabled &&
     other.facialRecognitionEnabled == facialRecognitionEnabled &&
     other.tagImageEnabled == tagImageEnabled &&
     other.url == url;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (clipEncodeEnabled.hashCode) +
    (enabled.hashCode) +
    (facialRecognitionEnabled.hashCode) +
    (tagImageEnabled.hashCode) +
    (url.hashCode);

  @override
  String toString() => 'SystemConfigMachineLearningDto[clipEncodeEnabled=$clipEncodeEnabled, enabled=$enabled, facialRecognitionEnabled=$facialRecognitionEnabled, tagImageEnabled=$tagImageEnabled, url=$url]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'clipEncodeEnabled'] = this.clipEncodeEnabled;
      json[r'enabled'] = this.enabled;
      json[r'facialRecognitionEnabled'] = this.facialRecognitionEnabled;
      json[r'tagImageEnabled'] = this.tagImageEnabled;
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
        clipEncodeEnabled: mapValueOfType<bool>(json, r'clipEncodeEnabled')!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        facialRecognitionEnabled: mapValueOfType<bool>(json, r'facialRecognitionEnabled')!,
        tagImageEnabled: mapValueOfType<bool>(json, r'tagImageEnabled')!,
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
    'clipEncodeEnabled',
    'enabled',
    'facialRecognitionEnabled',
    'tagImageEnabled',
    'url',
  };
}

