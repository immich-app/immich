// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TimeBucketsResponseDto {
  const TimeBucketsResponseDto({required this.count, required this.timeBucket});

  /// Number of assets in this time bucket
  final int count;

  /// Time bucket identifier in YYYY-MM-DD format representing the start of the time period
  final String timeBucket;

  static TimeBucketsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TimeBucketsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(count: json[r'count'] as int, timeBucket: json[r'timeBucket'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'count'] = count;
    json[r'timeBucket'] = timeBucket;
    return json;
  }

  TimeBucketsResponseDto copyWith({int? count, String? timeBucket}) {
    return .new(count: count ?? this.count, timeBucket: timeBucket ?? this.timeBucket);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is TimeBucketsResponseDto && count == other.count && timeBucket == other.timeBucket);
  }

  @override
  int get hashCode {
    return Object.hashAll([count, timeBucket]);
  }

  @override
  String toString() => 'TimeBucketsResponseDto(count=$count, timeBucket=$timeBucket)';
}
