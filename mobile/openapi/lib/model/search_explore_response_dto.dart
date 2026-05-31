// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SearchExploreResponseDto {
  const SearchExploreResponseDto({required this.fieldName, required this.items});

  /// Explore field name
  final String fieldName;

  final List<SearchExploreItem> items;

  static SearchExploreResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SearchExploreResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      fieldName: json[r'fieldName'] as String,
      items: ((json[r'items'] as List?)?.map(($e) => (SearchExploreItem.fromJson($e))!).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'fieldName'] = fieldName;
    json[r'items'] = items.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  SearchExploreResponseDto copyWith({String? fieldName, List<SearchExploreItem>? items}) {
    return .new(fieldName: fieldName ?? this.fieldName, items: items ?? this.items);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SearchExploreResponseDto &&
            fieldName == other.fieldName &&
            const DeepCollectionEquality().equals(items, other.items));
  }

  @override
  int get hashCode {
    return Object.hashAll([fieldName, const DeepCollectionEquality().hash(items)]);
  }

  @override
  String toString() => 'SearchExploreResponseDto(fieldName=$fieldName, items=$items)';
}
