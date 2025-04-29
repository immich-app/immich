//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TimelineAssetDescriptionDto {
  /// Returns a new [TimelineAssetDescriptionDto] instance.
  TimelineAssetDescriptionDto({
    required this.city,
    required this.country,
  });

  String? city;

  String? country;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TimelineAssetDescriptionDto &&
    other.city == city &&
    other.country == country;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode);

  @override
  String toString() => 'TimelineAssetDescriptionDto[city=$city, country=$country]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.city != null) {
      json[r'city'] = this.city;
    } else {
    //  json[r'city'] = null;
    }
    if (this.country != null) {
      json[r'country'] = this.country;
    } else {
    //  json[r'country'] = null;
    }
    return json;
  }

  /// Returns a new [TimelineAssetDescriptionDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TimelineAssetDescriptionDto? fromJson(dynamic value) {
    upgradeDto(value, "TimelineAssetDescriptionDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TimelineAssetDescriptionDto(
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
      );
    }
    return null;
  }

  static List<TimelineAssetDescriptionDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TimelineAssetDescriptionDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TimelineAssetDescriptionDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TimelineAssetDescriptionDto> mapFromJson(dynamic json) {
    final map = <String, TimelineAssetDescriptionDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TimelineAssetDescriptionDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TimelineAssetDescriptionDto-objects as value to a dart map
  static Map<String, List<TimelineAssetDescriptionDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TimelineAssetDescriptionDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TimelineAssetDescriptionDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'city',
    'country',
  };
}

