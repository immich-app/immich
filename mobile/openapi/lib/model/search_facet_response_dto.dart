//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchFacetResponseDto {
  /// Returns a new [SearchFacetResponseDto] instance.
  SearchFacetResponseDto({
    this.counts = const [],
    required this.fieldName,
  });

  List<SearchFacetCountResponseDto> counts;

  String fieldName;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchFacetResponseDto &&
    _deepEquality.equals(other.counts, counts) &&
    other.fieldName == fieldName;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (counts.hashCode) +
    (fieldName.hashCode);

  @override
  String toString() => 'SearchFacetResponseDto[counts=$counts, fieldName=$fieldName]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'counts'] = this.counts;
      json[r'fieldName'] = this.fieldName;
    return json;
  }

  /// Returns a new [SearchFacetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchFacetResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SearchFacetResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SearchFacetResponseDto(
        counts: SearchFacetCountResponseDto.listFromJson(json[r'counts']),
        fieldName: mapValueOfType<String>(json, r'fieldName')!,
      );
    }
    return null;
  }

  static List<SearchFacetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchFacetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchFacetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchFacetResponseDto> mapFromJson(dynamic json) {
    final map = <String, SearchFacetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchFacetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchFacetResponseDto-objects as value to a dart map
  static Map<String, List<SearchFacetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchFacetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchFacetResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'counts',
    'fieldName',
  };
}

