//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MapMarkerResponseDto {
  /// Returns a new [MapMarkerResponseDto] instance.
  MapMarkerResponseDto({
    required this.city,
    required this.country,
    required this.id,
    required this.lat,
    required this.lon,
    required this.state,
  });

  String? city;

  String? country;

  String id;

  double lat;

  double lon;

  String? state;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MapMarkerResponseDto &&
    other.city == city &&
    other.country == country &&
    other.id == id &&
    other.lat == lat &&
    other.lon == lon &&
    other.state == state;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (id.hashCode) +
    (lat.hashCode) +
    (lon.hashCode) +
    (state == null ? 0 : state!.hashCode);

  @override
  String toString() => 'MapMarkerResponseDto[city=$city, country=$country, id=$id, lat=$lat, lon=$lon, state=$state]';

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
      json[r'id'] = this.id;
      json[r'lat'] = this.lat;
      json[r'lon'] = this.lon;
    if (this.state != null) {
      json[r'state'] = this.state;
    } else {
    //  json[r'state'] = null;
    }
    return json;
  }

  /// Returns a new [MapMarkerResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MapMarkerResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MapMarkerResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MapMarkerResponseDto(
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
        id: mapValueOfType<String>(json, r'id')!,
        lat: (mapValueOfType<num>(json, r'lat')!).toDouble(),
        lon: (mapValueOfType<num>(json, r'lon')!).toDouble(),
        state: mapValueOfType<String>(json, r'state'),
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
    'city',
    'country',
    'id',
    'lat',
    'lon',
    'state',
  };
}

