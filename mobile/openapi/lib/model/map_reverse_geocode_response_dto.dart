//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MapReverseGeocodeResponseDto {
  /// Returns a new [MapReverseGeocodeResponseDto] instance.
  MapReverseGeocodeResponseDto({
    required this.city,
    required this.country,
    required this.state,
  });

  String? city;

  String? country;

  String? state;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MapReverseGeocodeResponseDto &&
    other.city == city &&
    other.country == country &&
    other.state == state;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (state == null ? 0 : state!.hashCode);

  @override
  String toString() => 'MapReverseGeocodeResponseDto[city=$city, country=$country, state=$state]';

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
    if (this.state != null) {
      json[r'state'] = this.state;
    } else {
    //  json[r'state'] = null;
    }
    return json;
  }

  /// Returns a new [MapReverseGeocodeResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MapReverseGeocodeResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MapReverseGeocodeResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MapReverseGeocodeResponseDto(
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
        state: mapValueOfType<String>(json, r'state'),
      );
    }
    return null;
  }

  static List<MapReverseGeocodeResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MapReverseGeocodeResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MapReverseGeocodeResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MapReverseGeocodeResponseDto> mapFromJson(dynamic json) {
    final map = <String, MapReverseGeocodeResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MapReverseGeocodeResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MapReverseGeocodeResponseDto-objects as value to a dart map
  static Map<String, List<MapReverseGeocodeResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MapReverseGeocodeResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MapReverseGeocodeResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'city',
    'country',
    'state',
  };
}

