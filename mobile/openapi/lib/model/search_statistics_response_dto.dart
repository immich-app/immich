// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SearchStatisticsResponseDto {
  const SearchStatisticsResponseDto({required this.total});

  /// Total number of matching assets
  final int total;

  static SearchStatisticsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SearchStatisticsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(total: json[r'total'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'total'] = total;
    return json;
  }

  SearchStatisticsResponseDto copyWith({int? total}) {
    return .new(total: total ?? this.total);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SearchStatisticsResponseDto && total == other.total);
  }

  @override
  int get hashCode {
    return Object.hashAll([total]);
  }

  @override
  String toString() => 'SearchStatisticsResponseDto(total=$total)';
}
