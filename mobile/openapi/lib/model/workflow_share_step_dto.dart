// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class WorkflowShareStepDto {
  const WorkflowShareStepDto({required this.config, this.enabled, required this.method});

  /// Step configuration
  final Map<String, dynamic>? config;

  /// Step is enabled
  final bool? enabled;

  /// Step plugin method
  final String method;

  static const _undefined = Object();

  static WorkflowShareStepDto? fromJson(dynamic value) {
    ApiCompat.upgrade<WorkflowShareStepDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      config: (json[r'config'] as Map?)?.cast<String, dynamic>(),
      enabled: (json[r'enabled'] as bool?),
      method: json[r'method'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (config != null) {
      json[r'config'] = config!;
    }
    if (enabled != null) {
      json[r'enabled'] = enabled!;
    }
    json[r'method'] = method;
    return json;
  }

  WorkflowShareStepDto copyWith({Object? config = _undefined, Object? enabled = _undefined, String? method}) {
    return .new(
      config: identical(config, _undefined) ? this.config : config as Map<String, dynamic>?,
      enabled: identical(enabled, _undefined) ? this.enabled : enabled as bool?,
      method: method ?? this.method,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is WorkflowShareStepDto &&
            const DeepCollectionEquality().equals(config, other.config) &&
            enabled == other.enabled &&
            method == other.method);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(config), enabled, method]);
  }

  @override
  String toString() => 'WorkflowShareStepDto(config=$config, enabled=$enabled, method=$method)';
}
