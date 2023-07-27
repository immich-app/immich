//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchAssetDto {
  /// Returns a new [SearchAssetDto] instance.
  SearchAssetDto({
    required this.searchTerm,
  });

  String searchTerm;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchAssetDto &&
     other.searchTerm == searchTerm;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (searchTerm.hashCode);

  @override
  String toString() => 'SearchAssetDto[searchTerm=$searchTerm]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'searchTerm'] = this.searchTerm;
    return json;
  }

  /// Returns a new [SearchAssetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchAssetDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SearchAssetDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SearchAssetDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SearchAssetDto(
        searchTerm: mapValueOfType<String>(json, r'searchTerm')!,
      );
    }
    return null;
  }

  static List<SearchAssetDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchAssetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchAssetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchAssetDto> mapFromJson(dynamic json) {
    final map = <String, SearchAssetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchAssetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchAssetDto-objects as value to a dart map
  static Map<String, List<SearchAssetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchAssetDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchAssetDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'searchTerm',
  };
}

