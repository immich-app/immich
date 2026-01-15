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
    required this.availabilityChecks,
    required this.circuitBreaker,
    required this.clip,
    required this.duplicateDetection,
    required this.enabled,
    required this.facialRecognition,
    required this.ocr,
    required this.requestTimeout,
    required this.streamMode,
    this.urls = const [],
  });

  MachineLearningAvailabilityChecksDto availabilityChecks;

  MachineLearningCircuitBreakerDto circuitBreaker;

  CLIPConfig clip;

  DuplicateDetectionConfig duplicateDetection;

  bool enabled;

  FacialRecognitionConfig facialRecognition;

  OcrConfig ocr;

  /// Minimum value: 1000
  num requestTimeout;

  MachineLearningStreamModeDto streamMode;

  List<String> urls;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigMachineLearningDto &&
    other.availabilityChecks == availabilityChecks &&
    other.circuitBreaker == circuitBreaker &&
    other.clip == clip &&
    other.duplicateDetection == duplicateDetection &&
    other.enabled == enabled &&
    other.facialRecognition == facialRecognition &&
    other.ocr == ocr &&
    other.requestTimeout == requestTimeout &&
    other.streamMode == streamMode &&
    _deepEquality.equals(other.urls, urls);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (availabilityChecks.hashCode) +
    (circuitBreaker.hashCode) +
    (clip.hashCode) +
    (duplicateDetection.hashCode) +
    (enabled.hashCode) +
    (facialRecognition.hashCode) +
    (ocr.hashCode) +
    (requestTimeout.hashCode) +
    (streamMode.hashCode) +
    (urls.hashCode);

  @override
  String toString() => 'SystemConfigMachineLearningDto[availabilityChecks=$availabilityChecks, circuitBreaker=$circuitBreaker, clip=$clip, duplicateDetection=$duplicateDetection, enabled=$enabled, facialRecognition=$facialRecognition, ocr=$ocr, requestTimeout=$requestTimeout, streamMode=$streamMode, urls=$urls]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'availabilityChecks'] = this.availabilityChecks;
      json[r'circuitBreaker'] = this.circuitBreaker;
      json[r'clip'] = this.clip;
      json[r'duplicateDetection'] = this.duplicateDetection;
      json[r'enabled'] = this.enabled;
      json[r'facialRecognition'] = this.facialRecognition;
      json[r'ocr'] = this.ocr;
      json[r'requestTimeout'] = this.requestTimeout;
      json[r'streamMode'] = this.streamMode;
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
        availabilityChecks: MachineLearningAvailabilityChecksDto.fromJson(json[r'availabilityChecks'])!,
        circuitBreaker: MachineLearningCircuitBreakerDto.fromJson(json[r'circuitBreaker'])!,
        clip: CLIPConfig.fromJson(json[r'clip'])!,
        duplicateDetection: DuplicateDetectionConfig.fromJson(json[r'duplicateDetection'])!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        facialRecognition: FacialRecognitionConfig.fromJson(json[r'facialRecognition'])!,
        ocr: OcrConfig.fromJson(json[r'ocr'])!,
        requestTimeout: num.parse('${json[r'requestTimeout']}'),
        streamMode: MachineLearningStreamModeDto.fromJson(json[r'streamMode'])!,
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
    'availabilityChecks',
    'circuitBreaker',
    'clip',
    'duplicateDetection',
    'enabled',
    'facialRecognition',
    'ocr',
    'requestTimeout',
    'streamMode',
    'urls',
  };
}

