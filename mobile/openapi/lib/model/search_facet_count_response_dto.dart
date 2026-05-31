// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SearchFacetCountResponseDto {
  const SearchFacetCountResponseDto({required this.count, required this.value});

  /// Number of assets with this facet value
  final int count;

  /// Facet value
  final String value;

  static SearchFacetCountResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SearchFacetCountResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(count: json[r'count'] as int, value: json[r'value'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'count'] = count;
    json[r'value'] = value;
    return json;
  }

  SearchFacetCountResponseDto copyWith({int? count, String? value}) {
    return .new(count: count ?? this.count, value: value ?? this.value);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SearchFacetCountResponseDto && count == other.count && value == other.value);
  }

  @override
  int get hashCode {
    return Object.hashAll([count, value]);
  }

  @override
  String toString() => 'SearchFacetCountResponseDto(count=$count, value=$value)';
}
