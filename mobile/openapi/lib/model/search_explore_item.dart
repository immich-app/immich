// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SearchExploreItem {
  const SearchExploreItem({required this.data, required this.value});

  final AssetResponseDto data;

  /// Explore value
  final String value;

  static SearchExploreItem? fromJson(dynamic value) {
    ApiCompat.upgrade<SearchExploreItem>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(data: (AssetResponseDto.fromJson(json[r'data']))!, value: json[r'value'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'data'] = data.toJson();
    json[r'value'] = value;
    return json;
  }

  SearchExploreItem copyWith({AssetResponseDto? data, String? value}) {
    return .new(data: data ?? this.data, value: value ?? this.value);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SearchExploreItem && data == other.data && value == other.value);
  }

  @override
  int get hashCode {
    return Object.hashAll([data, value]);
  }

  @override
  String toString() => 'SearchExploreItem(data=$data, value=$value)';
}
