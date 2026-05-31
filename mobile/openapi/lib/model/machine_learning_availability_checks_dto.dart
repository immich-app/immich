// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MachineLearningAvailabilityChecksDto {
  const MachineLearningAvailabilityChecksDto({required this.enabled, required this.interval, required this.timeout});

  /// Enabled
  final bool enabled;

  final int interval;

  final int timeout;

  static MachineLearningAvailabilityChecksDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MachineLearningAvailabilityChecksDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      enabled: json[r'enabled'] as bool,
      interval: json[r'interval'] as int,
      timeout: json[r'timeout'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'interval'] = interval;
    json[r'timeout'] = timeout;
    return json;
  }

  MachineLearningAvailabilityChecksDto copyWith({bool? enabled, int? interval, int? timeout}) {
    return .new(
      enabled: enabled ?? this.enabled,
      interval: interval ?? this.interval,
      timeout: timeout ?? this.timeout,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MachineLearningAvailabilityChecksDto &&
            enabled == other.enabled &&
            interval == other.interval &&
            timeout == other.timeout);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, interval, timeout]);
  }

  @override
  String toString() => 'MachineLearningAvailabilityChecksDto(enabled=$enabled, interval=$interval, timeout=$timeout)';
}
