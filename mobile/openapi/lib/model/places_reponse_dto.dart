//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PlacesReponseDto {
  /// Returns a new [PlacesReponseDto] instance.
  PlacesReponseDto({
    this.admin1name,
    this.admin2name,
    required this.latitude,
    required this.longitude,
    required this.name,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? admin1name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? admin2name;

  num latitude;

  num longitude;

  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PlacesReponseDto &&
    other.admin1name == admin1name &&
    other.admin2name == admin2name &&
    other.latitude == latitude &&
    other.longitude == longitude &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (admin1name == null ? 0 : admin1name!.hashCode) +
    (admin2name == null ? 0 : admin2name!.hashCode) +
    (latitude.hashCode) +
    (longitude.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'PlacesReponseDto[admin1name=$admin1name, admin2name=$admin2name, latitude=$latitude, longitude=$longitude, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.admin1name != null) {
      json[r'admin1name'] = this.admin1name;
    } else {
    //  json[r'admin1name'] = null;
    }
    if (this.admin2name != null) {
      json[r'admin2name'] = this.admin2name;
    } else {
    //  json[r'admin2name'] = null;
    }
      json[r'latitude'] = this.latitude;
      json[r'longitude'] = this.longitude;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [PlacesReponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PlacesReponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PlacesReponseDto(
        admin1name: mapValueOfType<String>(json, r'admin1name'),
        admin2name: mapValueOfType<String>(json, r'admin2name'),
        latitude: num.parse('${json[r'latitude']}'),
        longitude: num.parse('${json[r'longitude']}'),
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<PlacesReponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PlacesReponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PlacesReponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PlacesReponseDto> mapFromJson(dynamic json) {
    final map = <String, PlacesReponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PlacesReponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PlacesReponseDto-objects as value to a dart map
  static Map<String, List<PlacesReponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PlacesReponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PlacesReponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'latitude',
    'longitude',
    'name',
  };
}

