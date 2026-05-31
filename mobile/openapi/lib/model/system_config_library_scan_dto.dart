// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigLibraryScanDto {
  const SystemConfigLibraryScanDto({required this.cronExpression, required this.enabled});

  /// Cron expression
  final String cronExpression;

  /// Enabled
  final bool enabled;

  static SystemConfigLibraryScanDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigLibraryScanDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(cronExpression: json[r'cronExpression'] as String, enabled: json[r'enabled'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'cronExpression'] = cronExpression;
    json[r'enabled'] = enabled;
    return json;
  }

  SystemConfigLibraryScanDto copyWith({String? cronExpression, bool? enabled}) {
    return .new(cronExpression: cronExpression ?? this.cronExpression, enabled: enabled ?? this.enabled);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigLibraryScanDto && cronExpression == other.cronExpression && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([cronExpression, enabled]);
  }

  @override
  String toString() => 'SystemConfigLibraryScanDto(cronExpression=$cronExpression, enabled=$enabled)';
}
