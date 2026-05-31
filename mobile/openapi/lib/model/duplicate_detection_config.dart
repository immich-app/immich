// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DuplicateDetectionConfig {
  const DuplicateDetectionConfig({required this.enabled, required this.maxDistance});

  /// Whether the task is enabled
  final bool enabled;

  /// Maximum distance threshold for duplicate detection
  final double maxDistance;

  static DuplicateDetectionConfig? fromJson(dynamic value) {
    ApiCompat.upgrade<DuplicateDetectionConfig>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: json[r'enabled'] as bool, maxDistance: (json[r'maxDistance'] as num).toDouble());
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'maxDistance'] = maxDistance;
    return json;
  }

  DuplicateDetectionConfig copyWith({bool? enabled, double? maxDistance}) {
    return .new(enabled: enabled ?? this.enabled, maxDistance: maxDistance ?? this.maxDistance);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DuplicateDetectionConfig && enabled == other.enabled && maxDistance == other.maxDistance);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, maxDistance]);
  }

  @override
  String toString() => 'DuplicateDetectionConfig(enabled=$enabled, maxDistance=$maxDistance)';
}
