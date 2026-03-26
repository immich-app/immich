//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FavoriteLocationResponseDto {
  /// Returns a new [FavoriteLocationResponseDto] instance.
  FavoriteLocationResponseDto({
    required this.id,
    required this.latitude,
    required this.longitude,
    required this.name,
  });

  String id;

  num? latitude;

  num? longitude;

  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FavoriteLocationResponseDto &&
    other.id == id &&
    other.latitude == latitude &&
    other.longitude == longitude &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'FavoriteLocationResponseDto[id=$id, latitude=$latitude, longitude=$longitude, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
    if (this.latitude != null) {
      json[r'latitude'] = this.latitude;
    } else {
    //  json[r'latitude'] = null;
    }
    if (this.longitude != null) {
      json[r'longitude'] = this.longitude;
    } else {
    //  json[r'longitude'] = null;
    }
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [FavoriteLocationResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FavoriteLocationResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "FavoriteLocationResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FavoriteLocationResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        latitude: json[r'latitude'] == null
            ? null
            : num.parse('${json[r'latitude']}'),
        longitude: json[r'longitude'] == null
            ? null
            : num.parse('${json[r'longitude']}'),
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<FavoriteLocationResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FavoriteLocationResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FavoriteLocationResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FavoriteLocationResponseDto> mapFromJson(dynamic json) {
    final map = <String, FavoriteLocationResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FavoriteLocationResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FavoriteLocationResponseDto-objects as value to a dart map
  static Map<String, List<FavoriteLocationResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FavoriteLocationResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FavoriteLocationResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'latitude',
    'longitude',
    'name',
  };
}

