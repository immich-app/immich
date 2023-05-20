//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MapMarkerResponseDto {
  /// Returns a new [MapMarkerResponseDto] instance.
  MapMarkerResponseDto({
    required this.id,
    required this.lat,
    required this.lon,
  });

  String id;

  double lat;

  double lon;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MapMarkerResponseDto &&
     other.id == id &&
     other.lat == lat &&
     other.lon == lon;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (lat.hashCode) +
    (lon.hashCode);

  @override
  String toString() => 'MapMarkerResponseDto[id=$id, lat=$lat, lon=$lon]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'lat'] = this.lat;
      json[r'lon'] = this.lon;
    return json;
  }

  /// Returns a new [MapMarkerResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MapMarkerResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "MapMarkerResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "MapMarkerResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return MapMarkerResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        lat: mapValueOfType<double>(json, r'lat')!,
        lon: mapValueOfType<double>(json, r'lon')!,
      );
    }
    return null;
  }

  static List<MapMarkerResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MapMarkerResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MapMarkerResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MapMarkerResponseDto> mapFromJson(dynamic json) {
    final map = <String, MapMarkerResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MapMarkerResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MapMarkerResponseDto-objects as value to a dart map
  static Map<String, List<MapMarkerResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MapMarkerResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MapMarkerResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'lat',
    'lon',
  };
}

