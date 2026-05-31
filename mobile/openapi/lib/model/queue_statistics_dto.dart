// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueueStatisticsDto {
  const QueueStatisticsDto({
    required this.active,
    required this.completed,
    required this.delayed,
    required this.failed,
    required this.paused,
    required this.waiting,
  });

  /// Number of active jobs
  final int active;

  /// Number of completed jobs
  final int completed;

  /// Number of delayed jobs
  final int delayed;

  /// Number of failed jobs
  final int failed;

  /// Number of paused jobs
  final int paused;

  /// Number of waiting jobs
  final int waiting;

  static QueueStatisticsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueueStatisticsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      active: json[r'active'] as int,
      completed: json[r'completed'] as int,
      delayed: json[r'delayed'] as int,
      failed: json[r'failed'] as int,
      paused: json[r'paused'] as int,
      waiting: json[r'waiting'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'active'] = active;
    json[r'completed'] = completed;
    json[r'delayed'] = delayed;
    json[r'failed'] = failed;
    json[r'paused'] = paused;
    json[r'waiting'] = waiting;
    return json;
  }

  QueueStatisticsDto copyWith({int? active, int? completed, int? delayed, int? failed, int? paused, int? waiting}) {
    return .new(
      active: active ?? this.active,
      completed: completed ?? this.completed,
      delayed: delayed ?? this.delayed,
      failed: failed ?? this.failed,
      paused: paused ?? this.paused,
      waiting: waiting ?? this.waiting,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is QueueStatisticsDto &&
            active == other.active &&
            completed == other.completed &&
            delayed == other.delayed &&
            failed == other.failed &&
            paused == other.paused &&
            waiting == other.waiting);
  }

  @override
  int get hashCode {
    return Object.hashAll([active, completed, delayed, failed, paused, waiting]);
  }

  @override
  String toString() =>
      'QueueStatisticsDto(active=$active, completed=$completed, delayed=$delayed, failed=$failed, paused=$paused, waiting=$waiting)';
}
