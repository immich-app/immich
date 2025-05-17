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
    this.city = const None(),
    this.country = const None(),
    this.state = const None(),
  });

  Option<String> city;

  Option<String> country;

  Option<String> state;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MapReverseGeocodeResponseDto &&
    other.city == city &&
    other.country == country &&
    other.state == state;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city.hashCode) +
    (country.hashCode) +
    (state.hashCode);

  @override
  String toString() => 'MapReverseGeocodeResponseDto[city=$city, country=$country, state=$state]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.city.unwrapOrNull() != null) {
      json[r'city'] = this.city;
    } else {
      if(this.city.isSome) {
        json[r'city'] = null;
      }
    }
    if (this.country.unwrapOrNull() != null) {
      json[r'country'] = this.country;
    } else {
      if(this.country.isSome) {
        json[r'country'] = null;
      }
    }
    if (this.state.unwrapOrNull() != null) {
      json[r'state'] = this.state;
    } else {
      if(this.state.isSome) {
        json[r'state'] = null;
      }
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
        city: Option.from(mapValueOfType<String>(json, r'city')),
        country: Option.from(mapValueOfType<String>(json, r'country')),
        state: Option.from(mapValueOfType<String>(json, r'state')),
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

