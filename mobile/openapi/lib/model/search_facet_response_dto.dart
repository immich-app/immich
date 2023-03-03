//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchFacetResponseDto {
  /// Returns a new [SearchFacetResponseDto] instance.
  SearchFacetResponseDto({
    required this.fieldName,
    this.counts = const [],
  });

  String fieldName;

  List<SearchFacetCountResponseDto> counts;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchFacetResponseDto &&
     other.fieldName == fieldName &&
     other.counts == counts;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (fieldName.hashCode) +
    (counts.hashCode);

  @override
  String toString() => 'SearchFacetResponseDto[fieldName=$fieldName, counts=$counts]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'fieldName'] = this.fieldName;
      json[r'counts'] = this.counts;
    return json;
  }

  /// Returns a new [SearchFacetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchFacetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SearchFacetResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SearchFacetResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SearchFacetResponseDto(
        fieldName: mapValueOfType<String>(json, r'fieldName')!,
        counts: SearchFacetCountResponseDto.listFromJson(json[r'counts'])!,
      );
    }
    return null;
  }

  static List<SearchFacetResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchFacetResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'fieldName',
    'counts',
  };
}

