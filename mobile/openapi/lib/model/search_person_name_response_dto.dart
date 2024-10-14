//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchPersonNameResponseDto {
  /// Returns a new [SearchPersonNameResponseDto] instance.
  SearchPersonNameResponseDto({
    this.hasNextPage,
    this.people = const [],
    this.total,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? hasNextPage;

  List<PersonResponseDto> people;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchPersonNameResponseDto &&
    other.hasNextPage == hasNextPage &&
    _deepEquality.equals(other.people, people) &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hasNextPage == null ? 0 : hasNextPage!.hashCode) +
    (people.hashCode) +
    (total == null ? 0 : total!.hashCode);

  @override
  String toString() => 'SearchPersonNameResponseDto[hasNextPage=$hasNextPage, people=$people, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.hasNextPage != null) {
      json[r'hasNextPage'] = this.hasNextPage;
    } else {
    //  json[r'hasNextPage'] = null;
    }
      json[r'people'] = this.people;
    if (this.total != null) {
      json[r'total'] = this.total;
    } else {
    //  json[r'total'] = null;
    }
    return json;
  }

  /// Returns a new [SearchPersonNameResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchPersonNameResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SearchPersonNameResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SearchPersonNameResponseDto(
        hasNextPage: mapValueOfType<bool>(json, r'hasNextPage'),
        people: PersonResponseDto.listFromJson(json[r'people']),
        total: mapValueOfType<int>(json, r'total'),
      );
    }
    return null;
  }

  static List<SearchPersonNameResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchPersonNameResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchPersonNameResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchPersonNameResponseDto> mapFromJson(dynamic json) {
    final map = <String, SearchPersonNameResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchPersonNameResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchPersonNameResponseDto-objects as value to a dart map
  static Map<String, List<SearchPersonNameResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchPersonNameResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchPersonNameResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'people',
  };
}

