// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MemoryStatisticsResponseDto {
  const MemoryStatisticsResponseDto({required this.total});

  /// Total number of memories
  final int total;

  static MemoryStatisticsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MemoryStatisticsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(total: json[r'total'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'total'] = total;
    return json;
  }

  MemoryStatisticsResponseDto copyWith({int? total}) {
    return .new(total: total ?? this.total);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is MemoryStatisticsResponseDto && total == other.total);
  }

  @override
  int get hashCode {
    return Object.hashAll([total]);
  }

  @override
  String toString() => 'MemoryStatisticsResponseDto(total=$total)';
}
