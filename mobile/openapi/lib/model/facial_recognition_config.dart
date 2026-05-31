// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class FacialRecognitionConfig {
  const FacialRecognitionConfig({
    required this.enabled,
    required this.maxDistance,
    required this.minFaces,
    required this.minScore,
    required this.modelName,
  });

  /// Whether the task is enabled
  final bool enabled;

  /// Maximum distance threshold for face recognition
  final double maxDistance;

  /// Minimum number of faces required for recognition
  final int minFaces;

  /// Minimum confidence score for face detection
  final double minScore;

  /// Name of the model to use
  final String modelName;

  static FacialRecognitionConfig? fromJson(dynamic value) {
    ApiCompat.upgrade<FacialRecognitionConfig>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      enabled: json[r'enabled'] as bool,
      maxDistance: (json[r'maxDistance'] as num).toDouble(),
      minFaces: json[r'minFaces'] as int,
      minScore: (json[r'minScore'] as num).toDouble(),
      modelName: json[r'modelName'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'maxDistance'] = maxDistance;
    json[r'minFaces'] = minFaces;
    json[r'minScore'] = minScore;
    json[r'modelName'] = modelName;
    return json;
  }

  FacialRecognitionConfig copyWith({
    bool? enabled,
    double? maxDistance,
    int? minFaces,
    double? minScore,
    String? modelName,
  }) {
    return .new(
      enabled: enabled ?? this.enabled,
      maxDistance: maxDistance ?? this.maxDistance,
      minFaces: minFaces ?? this.minFaces,
      minScore: minScore ?? this.minScore,
      modelName: modelName ?? this.modelName,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is FacialRecognitionConfig &&
            enabled == other.enabled &&
            maxDistance == other.maxDistance &&
            minFaces == other.minFaces &&
            minScore == other.minScore &&
            modelName == other.modelName);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, maxDistance, minFaces, minScore, modelName]);
  }

  @override
  String toString() =>
      'FacialRecognitionConfig(enabled=$enabled, maxDistance=$maxDistance, minFaces=$minFaces, minScore=$minScore, modelName=$modelName)';
}
