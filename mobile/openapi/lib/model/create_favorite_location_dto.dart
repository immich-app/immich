//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateFavoriteLocationDto {
  /// Returns a new [CreateFavoriteLocationDto] instance.
  CreateFavoriteLocationDto({
    required this.latitude,
    required this.longitude,
    required this.name,
  });

  num latitude;

  num longitude;

  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateFavoriteLocationDto &&
    other.latitude == latitude &&
    other.longitude == longitude &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (latitude.hashCode) +
    (longitude.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'CreateFavoriteLocationDto[latitude=$latitude, longitude=$longitude, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'latitude'] = this.latitude;
      json[r'longitude'] = this.longitude;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [CreateFavoriteLocationDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateFavoriteLocationDto? fromJson(dynamic value) {
    upgradeDto(value, "CreateFavoriteLocationDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateFavoriteLocationDto(
        latitude: num.parse('${json[r'latitude']}'),
        longitude: num.parse('${json[r'longitude']}'),
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<CreateFavoriteLocationDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateFavoriteLocationDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateFavoriteLocationDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateFavoriteLocationDto> mapFromJson(dynamic json) {
    final map = <String, CreateFavoriteLocationDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateFavoriteLocationDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateFavoriteLocationDto-objects as value to a dart map
  static Map<String, List<CreateFavoriteLocationDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateFavoriteLocationDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateFavoriteLocationDto.listFromJson(entry.value, growable: growable,);
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

