//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetTimelineLayoutResponseDto {
  /// Returns a new [AssetTimelineLayoutResponseDto] instance.
  AssetTimelineLayoutResponseDto({
    required this.timeBucket,
    required this.ratio,
  });

  String timeBucket;

  int ratio;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetTimelineLayoutResponseDto &&
     other.timeBucket == timeBucket &&
     other.ratio == ratio;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (timeBucket.hashCode) +
    (ratio.hashCode);

  @override
  String toString() => 'AssetTimelineLayoutResponseDto[timeBucket=$timeBucket, ratio=$ratio]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'timeBucket'] = this.timeBucket;
      json[r'ratio'] = this.ratio;
    return json;
  }

  /// Returns a new [AssetTimelineLayoutResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetTimelineLayoutResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AssetTimelineLayoutResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AssetTimelineLayoutResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AssetTimelineLayoutResponseDto(
        timeBucket: mapValueOfType<String>(json, r'timeBucket')!,
        ratio: mapValueOfType<int>(json, r'ratio')!,
      );
    }
    return null;
  }

  static List<AssetTimelineLayoutResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetTimelineLayoutResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetTimelineLayoutResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetTimelineLayoutResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetTimelineLayoutResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetTimelineLayoutResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetTimelineLayoutResponseDto-objects as value to a dart map
  static Map<String, List<AssetTimelineLayoutResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetTimelineLayoutResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetTimelineLayoutResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'timeBucket',
    'ratio',
  };
}

