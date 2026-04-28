//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartSearchFacetsResponseDto {
  /// Returns a new [SmartSearchFacetsResponseDto] instance.
  SmartSearchFacetsResponseDto({
    this.cameraMakes = const [],
    this.cameraModels = const [],
    this.cities = const [],
    this.countries = const [],
    required this.hasUnnamedPeople,
    this.mediaTypes = const [],
    this.people = const [],
    this.ratings = const [],
    this.tags = const [],
    this.timeBuckets = const [],
    required this.total,
  });

  /// Available camera makes
  List<String> cameraMakes;

  /// Available camera models for the current smart-search make scope
  List<String> cameraModels;

  /// Available cities for the current smart-search country scope
  List<String> cities;

  /// Available countries
  List<String> countries;

  /// Whether unnamed people exist in the filtered smart-search set
  bool hasUnnamedPeople;

  /// Available media types
  List<AssetTypeEnum> mediaTypes;

  /// Available people
  List<FilterSuggestionsPersonDto> people;

  /// Available ratings
  List<num> ratings;

  /// Available tags
  List<FilterSuggestionsTagDto> tags;

  /// Available monthly buckets for the smart-search result set
  List<TimeBucketsResponseDto> timeBuckets;

  /// Exact count after applying all active smart-search filters
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartSearchFacetsResponseDto &&
    _deepEquality.equals(other.cameraMakes, cameraMakes) &&
    _deepEquality.equals(other.cameraModels, cameraModels) &&
    _deepEquality.equals(other.cities, cities) &&
    _deepEquality.equals(other.countries, countries) &&
    other.hasUnnamedPeople == hasUnnamedPeople &&
    _deepEquality.equals(other.mediaTypes, mediaTypes) &&
    _deepEquality.equals(other.people, people) &&
    _deepEquality.equals(other.ratings, ratings) &&
    _deepEquality.equals(other.tags, tags) &&
    _deepEquality.equals(other.timeBuckets, timeBuckets) &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cameraMakes.hashCode) +
    (cameraModels.hashCode) +
    (cities.hashCode) +
    (countries.hashCode) +
    (hasUnnamedPeople.hashCode) +
    (mediaTypes.hashCode) +
    (people.hashCode) +
    (ratings.hashCode) +
    (tags.hashCode) +
    (timeBuckets.hashCode) +
    (total.hashCode);

  @override
  String toString() => 'SmartSearchFacetsResponseDto[cameraMakes=$cameraMakes, cameraModels=$cameraModels, cities=$cities, countries=$countries, hasUnnamedPeople=$hasUnnamedPeople, mediaTypes=$mediaTypes, people=$people, ratings=$ratings, tags=$tags, timeBuckets=$timeBuckets, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'cameraMakes'] = this.cameraMakes;
      json[r'cameraModels'] = this.cameraModels;
      json[r'cities'] = this.cities;
      json[r'countries'] = this.countries;
      json[r'hasUnnamedPeople'] = this.hasUnnamedPeople;
      json[r'mediaTypes'] = this.mediaTypes;
      json[r'people'] = this.people;
      json[r'ratings'] = this.ratings;
      json[r'tags'] = this.tags;
      json[r'timeBuckets'] = this.timeBuckets;
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [SmartSearchFacetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartSearchFacetsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SmartSearchFacetsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SmartSearchFacetsResponseDto(
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
        hasUnnamedPeople: mapValueOfType<bool>(json, r'hasUnnamedPeople')!,
        mediaTypes: AssetTypeEnum.listFromJson(json[r'mediaTypes']),
        people: FilterSuggestionsPersonDto.listFromJson(json[r'people']),
        ratings: json[r'ratings'] is Iterable
            ? (json[r'ratings'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        tags: FilterSuggestionsTagDto.listFromJson(json[r'tags']),
        timeBuckets: TimeBucketsResponseDto.listFromJson(json[r'timeBuckets']),
        total: mapValueOfType<int>(json, r'total')!,
      );
    }
    return null;
  }

  static List<SmartSearchFacetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SmartSearchFacetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SmartSearchFacetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SmartSearchFacetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, SmartSearchFacetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartSearchFacetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SmartSearchFacetsResponseDto-objects as value to a dart map
  static Map<String, List<SmartSearchFacetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SmartSearchFacetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SmartSearchFacetsResponseDto.listFromJson(entry.value, growable: growable,);
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
    'hasUnnamedPeople',
    'mediaTypes',
    'people',
    'ratings',
    'tags',
    'timeBuckets',
    'total',
  };
}

