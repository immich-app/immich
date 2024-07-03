//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleUpdateDto {
  /// Returns a new [PeopleUpdateDto] instance.
  PeopleUpdateDto({
    this.people = const [],
  });

  List<PeopleUpdateItem> people;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleUpdateDto &&
    _deepEquality.equals(other.people, people);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (people.hashCode);

  @override
  String toString() => 'PeopleUpdateDto[people=$people]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'people'] = this.people;
    return json;
  }

  /// Returns a new [PeopleUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleUpdateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleUpdateDto(
        people: PeopleUpdateItem.listFromJson(json[r'people']),
      );
    }
    return null;
  }

  static List<PeopleUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleUpdateDto> mapFromJson(dynamic json) {
    final map = <String, PeopleUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleUpdateDto-objects as value to a dart map
  static Map<String, List<PeopleUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'people',
  };
}

