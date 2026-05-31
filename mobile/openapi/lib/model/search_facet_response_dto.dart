// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SearchFacetResponseDto {
  const SearchFacetResponseDto({required this.counts, required this.fieldName});

  final List<SearchFacetCountResponseDto> counts;

  /// Facet field name
  final String fieldName;

  static SearchFacetResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SearchFacetResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      counts: ((json[r'counts'] as List?)
          ?.map(($e) => (SearchFacetCountResponseDto.fromJson($e))!)
          .toList(growable: false))!,
      fieldName: json[r'fieldName'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'counts'] = counts.map(($e) => $e.toJson()).toList(growable: false);
    json[r'fieldName'] = fieldName;
    return json;
  }

  SearchFacetResponseDto copyWith({List<SearchFacetCountResponseDto>? counts, String? fieldName}) {
    return .new(counts: counts ?? this.counts, fieldName: fieldName ?? this.fieldName);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SearchFacetResponseDto &&
            const DeepCollectionEquality().equals(counts, other.counts) &&
            fieldName == other.fieldName);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(counts), fieldName]);
  }

  @override
  String toString() => 'SearchFacetResponseDto(counts=$counts, fieldName=$fieldName)';
}
