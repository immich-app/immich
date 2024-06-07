//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class OnThisDayDto {
  /// Returns a new [OnThisDayDto] instance.
  OnThisDayDto({
    required this.year,
  });

  /// Minimum value: 1
  num year;

  @override
  bool operator ==(Object other) => identical(this, other) || other is OnThisDayDto &&
    other.year == year;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (year.hashCode);

  @override
  String toString() => 'OnThisDayDto[year=$year]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'year'] = this.year;
    return json;
  }

  /// Returns a new [OnThisDayDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static OnThisDayDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return OnThisDayDto(
        year: num.parse('${json[r'year']}'),
      );
    }
    return null;
  }

  static List<OnThisDayDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <OnThisDayDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = OnThisDayDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, OnThisDayDto> mapFromJson(dynamic json) {
    final map = <String, OnThisDayDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = OnThisDayDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of OnThisDayDto-objects as value to a dart map
  static Map<String, List<OnThisDayDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<OnThisDayDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = OnThisDayDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'year',
  };
}

