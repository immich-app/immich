// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class OcrConfig {
  const OcrConfig({
    required this.enabled,
    required this.maxResolution,
    required this.minDetectionScore,
    required this.minRecognitionScore,
    required this.modelName,
  });

  /// Whether the task is enabled
  final bool enabled;

  /// Maximum resolution for OCR processing
  final int maxResolution;

  /// Minimum confidence score for text detection
  final double minDetectionScore;

  /// Minimum confidence score for text recognition
  final double minRecognitionScore;

  /// Name of the model to use
  final String modelName;

  static OcrConfig? fromJson(dynamic value) {
    ApiCompat.upgrade<OcrConfig>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      enabled: json[r'enabled'] as bool,
      maxResolution: json[r'maxResolution'] as int,
      minDetectionScore: (json[r'minDetectionScore'] as num).toDouble(),
      minRecognitionScore: (json[r'minRecognitionScore'] as num).toDouble(),
      modelName: json[r'modelName'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'maxResolution'] = maxResolution;
    json[r'minDetectionScore'] = minDetectionScore;
    json[r'minRecognitionScore'] = minRecognitionScore;
    json[r'modelName'] = modelName;
    return json;
  }

  OcrConfig copyWith({
    bool? enabled,
    int? maxResolution,
    double? minDetectionScore,
    double? minRecognitionScore,
    String? modelName,
  }) {
    return .new(
      enabled: enabled ?? this.enabled,
      maxResolution: maxResolution ?? this.maxResolution,
      minDetectionScore: minDetectionScore ?? this.minDetectionScore,
      minRecognitionScore: minRecognitionScore ?? this.minRecognitionScore,
      modelName: modelName ?? this.modelName,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is OcrConfig &&
            enabled == other.enabled &&
            maxResolution == other.maxResolution &&
            minDetectionScore == other.minDetectionScore &&
            minRecognitionScore == other.minRecognitionScore &&
            modelName == other.modelName);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, maxResolution, minDetectionScore, minRecognitionScore, modelName]);
  }

  @override
  String toString() =>
      'OcrConfig(enabled=$enabled, maxResolution=$maxResolution, minDetectionScore=$minDetectionScore, minRecognitionScore=$minRecognitionScore, modelName=$modelName)';
}
