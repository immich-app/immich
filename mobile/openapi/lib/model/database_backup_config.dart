// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DatabaseBackupConfig {
  const DatabaseBackupConfig({required this.cronExpression, required this.enabled, required this.keepLastAmount});

  /// Cron expression
  final String cronExpression;

  /// Enabled
  final bool enabled;

  /// Keep last amount
  final int keepLastAmount;

  static DatabaseBackupConfig? fromJson(dynamic value) {
    ApiCompat.upgrade<DatabaseBackupConfig>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      cronExpression: json[r'cronExpression'] as String,
      enabled: json[r'enabled'] as bool,
      keepLastAmount: json[r'keepLastAmount'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'cronExpression'] = cronExpression;
    json[r'enabled'] = enabled;
    json[r'keepLastAmount'] = keepLastAmount;
    return json;
  }

  DatabaseBackupConfig copyWith({String? cronExpression, bool? enabled, int? keepLastAmount}) {
    return .new(
      cronExpression: cronExpression ?? this.cronExpression,
      enabled: enabled ?? this.enabled,
      keepLastAmount: keepLastAmount ?? this.keepLastAmount,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DatabaseBackupConfig &&
            cronExpression == other.cronExpression &&
            enabled == other.enabled &&
            keepLastAmount == other.keepLastAmount);
  }

  @override
  int get hashCode {
    return Object.hashAll([cronExpression, enabled, keepLastAmount]);
  }

  @override
  String toString() =>
      'DatabaseBackupConfig(cronExpression=$cronExpression, enabled=$enabled, keepLastAmount=$keepLastAmount)';
}
