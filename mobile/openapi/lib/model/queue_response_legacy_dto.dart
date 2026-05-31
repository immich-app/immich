// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueueResponseLegacyDto {
  const QueueResponseLegacyDto({required this.jobCounts, required this.queueStatus});

  final QueueStatisticsDto jobCounts;

  final QueueStatusLegacyDto queueStatus;

  static QueueResponseLegacyDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueueResponseLegacyDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      jobCounts: (QueueStatisticsDto.fromJson(json[r'jobCounts']))!,
      queueStatus: (QueueStatusLegacyDto.fromJson(json[r'queueStatus']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'jobCounts'] = jobCounts.toJson();
    json[r'queueStatus'] = queueStatus.toJson();
    return json;
  }

  QueueResponseLegacyDto copyWith({QueueStatisticsDto? jobCounts, QueueStatusLegacyDto? queueStatus}) {
    return .new(jobCounts: jobCounts ?? this.jobCounts, queueStatus: queueStatus ?? this.queueStatus);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is QueueResponseLegacyDto && jobCounts == other.jobCounts && queueStatus == other.queueStatus);
  }

  @override
  int get hashCode {
    return Object.hashAll([jobCounts, queueStatus]);
  }

  @override
  String toString() => 'QueueResponseLegacyDto(jobCounts=$jobCounts, queueStatus=$queueStatus)';
}
