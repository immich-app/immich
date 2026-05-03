//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MergeScopedPeopleDto {
  /// Returns a new [MergeScopedPeopleDto] instance.
  MergeScopedPeopleDto({
    this.sources = const [],
    required this.target,
  });

  /// Source scoped profiles
  List<ScopedPersonProfileRefDto> sources;

  ScopedPersonProfileRefDto target;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MergeScopedPeopleDto &&
    _deepEquality.equals(other.sources, sources) &&
    other.target == target;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sources.hashCode) +
    (target.hashCode);

  @override
  String toString() => 'MergeScopedPeopleDto[sources=$sources, target=$target]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'sources'] = this.sources;
      json[r'target'] = this.target;
    return json;
  }

  /// Returns a new [MergeScopedPeopleDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MergeScopedPeopleDto? fromJson(dynamic value) {
    upgradeDto(value, "MergeScopedPeopleDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MergeScopedPeopleDto(
        sources: ScopedPersonProfileRefDto.listFromJson(json[r'sources']),
        target: ScopedPersonProfileRefDto.fromJson(json[r'target'])!,
      );
    }
    return null;
  }

  static List<MergeScopedPeopleDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MergeScopedPeopleDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MergeScopedPeopleDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MergeScopedPeopleDto> mapFromJson(dynamic json) {
    final map = <String, MergeScopedPeopleDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MergeScopedPeopleDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MergeScopedPeopleDto-objects as value to a dart map
  static Map<String, List<MergeScopedPeopleDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MergeScopedPeopleDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MergeScopedPeopleDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sources',
    'target',
  };
}

