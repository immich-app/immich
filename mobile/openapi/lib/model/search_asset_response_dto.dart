// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SearchAssetResponseDto {
  const SearchAssetResponseDto({
    required this.count,
    required this.facets,
    required this.items,
    required this.nextPage,
    required this.total,
  });

  /// Number of assets in this page
  final int count;

  final List<SearchFacetResponseDto> facets;

  final List<AssetResponseDto> items;

  /// Next page token
  final String? nextPage;

  /// Total number of matching assets
  @Deprecated(r'Deprecated by the Immich server API since v3.0.0.')
  final int total;

  static const _undefined = Object();

  static const ApiVersion totalDeprecatedIn = .new(3, 0, 0);

  static const ApiState totalState = .deprecated;

  static SearchAssetResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SearchAssetResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      count: json[r'count'] as int,
      facets: ((json[r'facets'] as List?)
          ?.map(($e) => (SearchFacetResponseDto.fromJson($e))!)
          .toList(growable: false))!,
      items: ((json[r'items'] as List?)?.map(($e) => (AssetResponseDto.fromJson($e))!).toList(growable: false))!,
      nextPage: (json[r'nextPage'] as String?),
      total: json[r'total'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'count'] = count;
    json[r'facets'] = facets.map(($e) => $e.toJson()).toList(growable: false);
    json[r'items'] = items.map(($e) => $e.toJson()).toList(growable: false);
    if (nextPage != null) {
      json[r'nextPage'] = nextPage!;
    }
    json[r'total'] = total;
    return json;
  }

  SearchAssetResponseDto copyWith({
    int? count,
    List<SearchFacetResponseDto>? facets,
    List<AssetResponseDto>? items,
    Object? nextPage = _undefined,
    int? total,
  }) {
    return .new(
      count: count ?? this.count,
      facets: facets ?? this.facets,
      items: items ?? this.items,
      nextPage: identical(nextPage, _undefined) ? this.nextPage : nextPage as String?,
      total: total ?? this.total,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SearchAssetResponseDto &&
            count == other.count &&
            const DeepCollectionEquality().equals(facets, other.facets) &&
            const DeepCollectionEquality().equals(items, other.items) &&
            nextPage == other.nextPage &&
            total == other.total);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      count,
      const DeepCollectionEquality().hash(facets),
      const DeepCollectionEquality().hash(items),
      nextPage,
      total,
    ]);
  }

  @override
  String toString() =>
      'SearchAssetResponseDto(count=$count, facets=$facets, items=$items, nextPage=$nextPage, total=$total)';
}
