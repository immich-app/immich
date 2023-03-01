//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchAssetResponseDto {
  /// Returns a new [SearchAssetResponseDto] instance.
  SearchAssetResponseDto({
    required this.total,
    required this.count,
    this.items = const [],
    this.facets = const [],
  });

  int total;

  int count;

  List<AssetResponseDto> items;

  List<SearchFacetResponseDto> facets;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchAssetResponseDto &&
     other.total == total &&
     other.count == count &&
     other.items == items &&
     other.facets == facets;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (total.hashCode) +
    (count.hashCode) +
    (items.hashCode) +
    (facets.hashCode);

  @override
  String toString() => 'SearchAssetResponseDto[total=$total, count=$count, items=$items, facets=$facets]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'total'] = this.total;
      json[r'count'] = this.count;
      json[r'items'] = this.items;
      json[r'facets'] = this.facets;
    return json;
  }

  /// Returns a new [SearchAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchAssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SearchAssetResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SearchAssetResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SearchAssetResponseDto(
        total: mapValueOfType<int>(json, r'total')!,
        count: mapValueOfType<int>(json, r'count')!,
        items: AssetResponseDto.listFromJson(json[r'items'])!,
        facets: SearchFacetResponseDto.listFromJson(json[r'facets'])!,
      );
    }
    return null;
  }

  static List<SearchAssetResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchAssetResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'total',
    'count',
    'items',
    'facets',
  };
}

