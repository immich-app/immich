//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchAssetResponseDto {
  /// Returns a new [SearchAssetResponseDto] instance.
  SearchAssetResponseDto({
    required this.count,
    this.facets = const [],
    this.items = const [],
    required this.nextPage,
    required this.total,
  });

  int count;

  List<SearchFacetResponseDto> facets;

  List<AssetResponseDto> items;

  String? nextPage;

  int total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchAssetResponseDto &&
    other.count == count &&
    _deepEquality.equals(other.facets, facets) &&
    _deepEquality.equals(other.items, items) &&
    other.nextPage == nextPage &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (count.hashCode) +
    (facets.hashCode) +
    (items.hashCode) +
    (nextPage == null ? 0 : nextPage!.hashCode) +
    (total.hashCode);

  @override
  String toString() => 'SearchAssetResponseDto[count=$count, facets=$facets, items=$items, nextPage=$nextPage, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'count'] = this.count;
      json[r'facets'] = this.facets;
      json[r'items'] = this.items;
    if (this.nextPage != null) {
      json[r'nextPage'] = this.nextPage;
    } else {
    //  json[r'nextPage'] = null;
    }
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [SearchAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchAssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SearchAssetResponseDto(
        count: mapValueOfType<int>(json, r'count')!,
        facets: SearchFacetResponseDto.listFromJson(json[r'facets']),
        items: AssetResponseDto.listFromJson(json[r'items']),
        nextPage: mapValueOfType<String>(json, r'nextPage'),
        total: mapValueOfType<int>(json, r'total')!,
      );
    }
    return null;
  }

  static List<SearchAssetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, SearchAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchAssetResponseDto-objects as value to a dart map
  static Map<String, List<SearchAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchAssetResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'count',
    'facets',
    'items',
    'nextPage',
    'total',
  };
}

