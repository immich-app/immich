//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MergePersonResponseDto {
  /// Returns a new [MergePersonResponseDto] instance.
  MergePersonResponseDto({
    required this.person,
    this.results = const [],
  });

  PersonResponseDto person;

  List<BulkIdResponseDto> results;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MergePersonResponseDto &&
     other.person == person &&
     other.results == results;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (person.hashCode) +
    (results.hashCode);

  @override
  String toString() => 'MergePersonResponseDto[person=$person, results=$results]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'person'] = this.person;
      json[r'results'] = this.results;
    return json;
  }

  /// Returns a new [MergePersonResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MergePersonResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MergePersonResponseDto(
        person: PersonResponseDto.fromJson(json[r'person'])!,
        results: BulkIdResponseDto.listFromJson(json[r'results']),
      );
    }
    return null;
  }

  static List<MergePersonResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MergePersonResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MergePersonResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MergePersonResponseDto> mapFromJson(dynamic json) {
    final map = <String, MergePersonResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MergePersonResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MergePersonResponseDto-objects as value to a dart map
  static Map<String, List<MergePersonResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MergePersonResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MergePersonResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'person',
    'results',
  };
}

