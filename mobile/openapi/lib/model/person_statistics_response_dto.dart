//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonStatisticsResponseDto {
  /// Returns a new [PersonStatisticsResponseDto] instance.
  PersonStatisticsResponseDto({
    required this.assets,
  });

  int assets;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonStatisticsResponseDto &&
    other.assets == assets;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode);

  @override
  String toString() => 'PersonStatisticsResponseDto[assets=$assets]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
    return json;
  }

  /// Returns a new [PersonStatisticsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonStatisticsResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonStatisticsResponseDto(
        assets: mapValueOfType<int>(json, r'assets')!,
      );
    }
    return null;
  }

  static List<PersonStatisticsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonStatisticsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonStatisticsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonStatisticsResponseDto> mapFromJson(dynamic json) {
    final map = <String, PersonStatisticsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonStatisticsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonStatisticsResponseDto-objects as value to a dart map
  static Map<String, List<PersonStatisticsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonStatisticsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonStatisticsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
  };
}

