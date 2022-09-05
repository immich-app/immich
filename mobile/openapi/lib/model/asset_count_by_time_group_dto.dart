//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetCountByTimeGroupDto {
  /// Returns a new [AssetCountByTimeGroupDto] instance.
  AssetCountByTimeGroupDto({
    required this.timeGroup,
    required this.count,
  });

  String timeGroup;

  int count;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetCountByTimeGroupDto &&
     other.timeGroup == timeGroup &&
     other.count == count;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (timeGroup.hashCode) +
    (count.hashCode);

  @override
  String toString() => 'AssetCountByTimeGroupDto[timeGroup=$timeGroup, count=$count]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'timeGroup'] = timeGroup;
      _json[r'count'] = count;
    return _json;
  }

  /// Returns a new [AssetCountByTimeGroupDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetCountByTimeGroupDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AssetCountByTimeGroupDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AssetCountByTimeGroupDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AssetCountByTimeGroupDto(
        timeGroup: mapValueOfType<String>(json, r'timeGroup')!,
        count: mapValueOfType<int>(json, r'count')!,
      );
    }
    return null;
  }

  static List<AssetCountByTimeGroupDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetCountByTimeGroupDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetCountByTimeGroupDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetCountByTimeGroupDto> mapFromJson(dynamic json) {
    final map = <String, AssetCountByTimeGroupDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCountByTimeGroupDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetCountByTimeGroupDto-objects as value to a dart map
  static Map<String, List<AssetCountByTimeGroupDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetCountByTimeGroupDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCountByTimeGroupDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'timeGroup',
    'count',
  };
}

