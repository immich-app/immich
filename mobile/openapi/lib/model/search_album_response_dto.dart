//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchAlbumResponseDto {
  /// Returns a new [SearchAlbumResponseDto] instance.
  SearchAlbumResponseDto({
    required this.total,
    required this.count,
    this.items = const [],
    this.facets = const [],
  });

  int total;

  int count;

  List<AlbumResponseDto> items;

  List<SearchFacetResponseDto> facets;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchAlbumResponseDto &&
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
  String toString() => 'SearchAlbumResponseDto[total=$total, count=$count, items=$items, facets=$facets]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'total'] = this.total;
      json[r'count'] = this.count;
      json[r'items'] = this.items;
      json[r'facets'] = this.facets;
    return json;
  }

  /// Returns a new [SearchAlbumResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchAlbumResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SearchAlbumResponseDto[$key]" is missing from JSON.');
          // assert(json[key] != null, 'Required key "SearchAlbumResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SearchAlbumResponseDto(
        total: mapValueOfType<int>(json, r'total')!,
        count: mapValueOfType<int>(json, r'count')!,
        items: AlbumResponseDto.listFromJson(json[r'items']),
        facets: SearchFacetResponseDto.listFromJson(json[r'facets']),
      );
    }
    return null;
  }

  static List<SearchAlbumResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchAlbumResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchAlbumResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchAlbumResponseDto> mapFromJson(dynamic json) {
    final map = <String, SearchAlbumResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchAlbumResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchAlbumResponseDto-objects as value to a dart map
  static Map<String, List<SearchAlbumResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchAlbumResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchAlbumResponseDto.listFromJson(entry.value, growable: growable,);
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

