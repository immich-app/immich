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
    this.url,
    this.urls = const [],
  });

  CLIPConfig clip;

  DuplicateDetectionConfig duplicateDetection;

  bool enabled;

  FacialRecognitionConfig facialRecognition;

  /// This property was deprecated in v1.122.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? url;

  List<String> urls;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigMachineLearningDto &&
    other.clip == clip &&
    other.duplicateDetection == duplicateDetection &&
    other.enabled == enabled &&
    other.facialRecognition == facialRecognition &&
    other.url == url &&
    _deepEquality.equals(other.urls, urls);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (clip.hashCode) +
    (duplicateDetection.hashCode) +
    (enabled.hashCode) +
    (facialRecognition.hashCode) +
    (url == null ? 0 : url!.hashCode) +
    (urls.hashCode);

  @override
  String toString() => 'SystemConfigMachineLearningDto[clip=$clip, duplicateDetection=$duplicateDetection, enabled=$enabled, facialRecognition=$facialRecognition, url=$url, urls=$urls]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'clip'] = this.clip;
      json[r'duplicateDetection'] = this.duplicateDetection;
      json[r'enabled'] = this.enabled;
      json[r'facialRecognition'] = this.facialRecognition;
    if (this.url != null) {
      json[r'url'] = this.url;
    } else {
    //  json[r'url'] = null;
    }
      json[r'urls'] = this.urls;
    return json;
  }

  /// Returns a new [SystemConfigMachineLearningDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigMachineLearningDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigMachineLearningDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigMachineLearningDto(
        clip: CLIPConfig.fromJson(json[r'clip'])!,
        duplicateDetection: DuplicateDetectionConfig.fromJson(json[r'duplicateDetection'])!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        facialRecognition: FacialRecognitionConfig.fromJson(json[r'facialRecognition'])!,
        url: mapValueOfType<String>(json, r'url'),
        urls: json[r'urls'] is Iterable
            ? (json[r'urls'] as Iterable).cast<String>().toList(growable: false)
            : const [],
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
    'urls',
  };
}

