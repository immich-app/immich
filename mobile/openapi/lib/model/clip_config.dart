// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ClipConfig {
  const ClipConfig({required this.enabled, required this.modelName});

  /// Whether the task is enabled
  final bool enabled;

  /// Name of the model to use
  final String modelName;

  static ClipConfig? fromJson(dynamic value) {
    ApiCompat.upgrade<ClipConfig>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: json[r'enabled'] as bool, modelName: json[r'modelName'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'modelName'] = modelName;
    return json;
  }

  ClipConfig copyWith({bool? enabled, String? modelName}) {
    return .new(enabled: enabled ?? this.enabled, modelName: modelName ?? this.modelName);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is ClipConfig && enabled == other.enabled && modelName == other.modelName);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, modelName]);
  }

  @override
  String toString() => 'ClipConfig(enabled=$enabled, modelName=$modelName)';
}
