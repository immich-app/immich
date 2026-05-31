// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueueStatusLegacyDto {
  const QueueStatusLegacyDto({required this.isActive, required this.isPaused});

  /// Whether the queue is currently active (has running jobs)
  final bool isActive;

  /// Whether the queue is paused
  final bool isPaused;

  static QueueStatusLegacyDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueueStatusLegacyDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(isActive: json[r'isActive'] as bool, isPaused: json[r'isPaused'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'isActive'] = isActive;
    json[r'isPaused'] = isPaused;
    return json;
  }

  QueueStatusLegacyDto copyWith({bool? isActive, bool? isPaused}) {
    return .new(isActive: isActive ?? this.isActive, isPaused: isPaused ?? this.isPaused);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is QueueStatusLegacyDto && isActive == other.isActive && isPaused == other.isPaused);
  }

  @override
  int get hashCode {
    return Object.hashAll([isActive, isPaused]);
  }

  @override
  String toString() => 'QueueStatusLegacyDto(isActive=$isActive, isPaused=$isPaused)';
}
