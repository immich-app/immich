// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigLoggingDto {
  const SystemConfigLoggingDto({required this.enabled, required this.level});

  /// Enabled
  final bool enabled;

  final LogLevel level;

  static SystemConfigLoggingDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigLoggingDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: json[r'enabled'] as bool, level: (LogLevel.fromJson(json[r'level']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'level'] = level.toJson();
    return json;
  }

  SystemConfigLoggingDto copyWith({bool? enabled, LogLevel? level}) {
    return .new(enabled: enabled ?? this.enabled, level: level ?? this.level);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigLoggingDto && enabled == other.enabled && level == other.level);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, level]);
  }

  @override
  String toString() => 'SystemConfigLoggingDto(enabled=$enabled, level=$level)';
}
