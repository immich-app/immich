//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchSuggestionResponseDto {
  /// Returns a new [SearchSuggestionResponseDto] instance.
  SearchSuggestionResponseDto({
    this.cameraMakes = const [],
    this.cameraModels = const [],
    this.cities = const [],
    this.countries = const [],
    this.states = const [],
  });

  List<String> cameraMakes;

  List<String> cameraModels;

  List<String> cities;

  List<String> countries;

  List<String> states;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchSuggestionResponseDto &&
    _deepEquality.equals(other.cameraMakes, cameraMakes) &&
    _deepEquality.equals(other.cameraModels, cameraModels) &&
    _deepEquality.equals(other.cities, cities) &&
    _deepEquality.equals(other.countries, countries) &&
    _deepEquality.equals(other.states, states);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cameraMakes.hashCode) +
    (cameraModels.hashCode) +
    (cities.hashCode) +
    (countries.hashCode) +
    (states.hashCode);

  @override
  String toString() => 'SearchSuggestionResponseDto[cameraMakes=$cameraMakes, cameraModels=$cameraModels, cities=$cities, countries=$countries, states=$states]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'cameraMakes'] = this.cameraMakes;
      json[r'cameraModels'] = this.cameraModels;
      json[r'cities'] = this.cities;
      json[r'countries'] = this.countries;
      json[r'states'] = this.states;
    return json;
  }

  /// Returns a new [SearchSuggestionResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchSuggestionResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SearchSuggestionResponseDto(
        cameraMakes: json[r'cameraMakes'] is Iterable
            ? (json[r'cameraMakes'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        cameraModels: json[r'cameraModels'] is Iterable
            ? (json[r'cameraModels'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        cities: json[r'cities'] is Iterable
            ? (json[r'cities'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        countries: json[r'countries'] is Iterable
            ? (json[r'countries'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        states: json[r'states'] is Iterable
            ? (json[r'states'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<SearchSuggestionResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchSuggestionResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchSuggestionResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchSuggestionResponseDto> mapFromJson(dynamic json) {
    final map = <String, SearchSuggestionResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchSuggestionResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchSuggestionResponseDto-objects as value to a dart map
  static Map<String, List<SearchSuggestionResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchSuggestionResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchSuggestionResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'cameraMakes',
    'cameraModels',
    'cities',
    'countries',
    'states',
  };
}

