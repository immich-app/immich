import 'package:openapi/api.dart';

class QueueStatistics {
  final int active;
  final int completed;
  final int failed;
  final int delayed;
  final int waiting;
  final int paused;

  const QueueStatistics({
    required this.active,
    required this.completed,
    required this.failed,
    required this.delayed,
    required this.waiting,
    required this.paused,
  });

  factory QueueStatistics.fromDto(QueueStatisticsDto dto) => QueueStatistics(
    active: dto.active,
    completed: dto.completed,
    failed: dto.failed,
    delayed: dto.delayed,
    waiting: dto.waiting,
    paused: dto.paused,
  );

  factory QueueStatistics.fromLegacyDto(QueueStatisticsDto dto) => QueueStatistics.fromDto(dto);
}

class QueueResponse {
  final String name;
  final bool isPaused;
  final QueueStatistics statistics;

  const QueueResponse({required this.name, required this.isPaused, required this.statistics});

  factory QueueResponse.fromDto(QueueResponseDto dto) =>
      QueueResponse(name: dto.name.value, isPaused: dto.isPaused, statistics: QueueStatistics.fromDto(dto.statistics));

  factory QueueResponse.fromLegacyDto(QueueResponseLegacyDto dto, String queueName) => QueueResponse(
    name: queueName,
    isPaused: dto.queueStatus.isPaused,
    statistics: QueueStatistics.fromLegacyDto(dto.jobCounts),
  );
}
