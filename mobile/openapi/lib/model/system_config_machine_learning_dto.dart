// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigMachineLearningDto {
  const SystemConfigMachineLearningDto({
    required this.availabilityChecks,
    required this.clip,
    required this.duplicateDetection,
    required this.enabled,
    required this.facialRecognition,
    required this.ocr,
    required this.urls,
  });

  final MachineLearningAvailabilityChecksDto availabilityChecks;

  final ClipConfig clip;

  final DuplicateDetectionConfig duplicateDetection;

  /// Enabled
  final bool enabled;

  final FacialRecognitionConfig facialRecognition;

  final OcrConfig ocr;

  /// ML service URLs
  final List<String> urls;

  static SystemConfigMachineLearningDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigMachineLearningDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      availabilityChecks: (MachineLearningAvailabilityChecksDto.fromJson(json[r'availabilityChecks']))!,
      clip: (ClipConfig.fromJson(json[r'clip']))!,
      duplicateDetection: (DuplicateDetectionConfig.fromJson(json[r'duplicateDetection']))!,
      enabled: json[r'enabled'] as bool,
      facialRecognition: (FacialRecognitionConfig.fromJson(json[r'facialRecognition']))!,
      ocr: (OcrConfig.fromJson(json[r'ocr']))!,
      urls: ((json[r'urls'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'availabilityChecks'] = availabilityChecks.toJson();
    json[r'clip'] = clip.toJson();
    json[r'duplicateDetection'] = duplicateDetection.toJson();
    json[r'enabled'] = enabled;
    json[r'facialRecognition'] = facialRecognition.toJson();
    json[r'ocr'] = ocr.toJson();
    json[r'urls'] = urls;
    return json;
  }

  SystemConfigMachineLearningDto copyWith({
    MachineLearningAvailabilityChecksDto? availabilityChecks,
    ClipConfig? clip,
    DuplicateDetectionConfig? duplicateDetection,
    bool? enabled,
    FacialRecognitionConfig? facialRecognition,
    OcrConfig? ocr,
    List<String>? urls,
  }) {
    return .new(
      availabilityChecks: availabilityChecks ?? this.availabilityChecks,
      clip: clip ?? this.clip,
      duplicateDetection: duplicateDetection ?? this.duplicateDetection,
      enabled: enabled ?? this.enabled,
      facialRecognition: facialRecognition ?? this.facialRecognition,
      ocr: ocr ?? this.ocr,
      urls: urls ?? this.urls,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigMachineLearningDto &&
            availabilityChecks == other.availabilityChecks &&
            clip == other.clip &&
            duplicateDetection == other.duplicateDetection &&
            enabled == other.enabled &&
            facialRecognition == other.facialRecognition &&
            ocr == other.ocr &&
            const DeepCollectionEquality().equals(urls, other.urls));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      availabilityChecks,
      clip,
      duplicateDetection,
      enabled,
      facialRecognition,
      ocr,
      const DeepCollectionEquality().hash(urls),
    ]);
  }

  @override
  String toString() =>
      'SystemConfigMachineLearningDto(availabilityChecks=$availabilityChecks, clip=$clip, duplicateDetection=$duplicateDetection, enabled=$enabled, facialRecognition=$facialRecognition, ocr=$ocr, urls=$urls)';
}
