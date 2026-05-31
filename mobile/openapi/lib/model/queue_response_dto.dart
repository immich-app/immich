// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueueResponseDto {
  const QueueResponseDto({required this.isPaused, required this.name, required this.statistics});

  /// Whether the queue is paused
  final bool isPaused;

  final QueueName name;

  final QueueStatisticsDto statistics;

  static QueueResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueueResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      isPaused: json[r'isPaused'] as bool,
      name: (QueueName.fromJson(json[r'name']))!,
      statistics: (QueueStatisticsDto.fromJson(json[r'statistics']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'isPaused'] = isPaused;
    json[r'name'] = name.toJson();
    json[r'statistics'] = statistics.toJson();
    return json;
  }

  QueueResponseDto copyWith({bool? isPaused, QueueName? name, QueueStatisticsDto? statistics}) {
    return .new(
      isPaused: isPaused ?? this.isPaused,
      name: name ?? this.name,
      statistics: statistics ?? this.statistics,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is QueueResponseDto &&
            isPaused == other.isPaused &&
            name == other.name &&
            statistics == other.statistics);
  }

  @override
  int get hashCode {
    return Object.hashAll([isPaused, name, statistics]);
  }

  @override
  String toString() => 'QueueResponseDto(isPaused=$isPaused, name=$name, statistics=$statistics)';
}
