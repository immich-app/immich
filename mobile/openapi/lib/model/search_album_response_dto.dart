// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SearchAlbumResponseDto {
  const SearchAlbumResponseDto({required this.count, required this.facets, required this.items, required this.total});

  /// Number of albums in this page
  final int count;

  final List<SearchFacetResponseDto> facets;

  final List<AlbumResponseDto> items;

  /// Total number of matching albums
  final int total;

  static SearchAlbumResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SearchAlbumResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      count: json[r'count'] as int,
      facets: ((json[r'facets'] as List?)
          ?.map(($e) => (SearchFacetResponseDto.fromJson($e))!)
          .toList(growable: false))!,
      items: ((json[r'items'] as List?)?.map(($e) => (AlbumResponseDto.fromJson($e))!).toList(growable: false))!,
      total: json[r'total'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'count'] = count;
    json[r'facets'] = facets.map(($e) => $e.toJson()).toList(growable: false);
    json[r'items'] = items.map(($e) => $e.toJson()).toList(growable: false);
    json[r'total'] = total;
    return json;
  }

  SearchAlbumResponseDto copyWith({
    int? count,
    List<SearchFacetResponseDto>? facets,
    List<AlbumResponseDto>? items,
    int? total,
  }) {
    return .new(
      count: count ?? this.count,
      facets: facets ?? this.facets,
      items: items ?? this.items,
      total: total ?? this.total,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SearchAlbumResponseDto &&
            count == other.count &&
            const DeepCollectionEquality().equals(facets, other.facets) &&
            const DeepCollectionEquality().equals(items, other.items) &&
            total == other.total);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      count,
      const DeepCollectionEquality().hash(facets),
      const DeepCollectionEquality().hash(items),
      total,
    ]);
  }

  @override
  String toString() => 'SearchAlbumResponseDto(count=$count, facets=$facets, items=$items, total=$total)';
}
