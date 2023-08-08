//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CuratedLocationsResponseDto {
  /// Returns a new [CuratedLocationsResponseDto] instance.
  CuratedLocationsResponseDto({
    required this.city,
    required this.deviceAssetId,
    required this.deviceId,
    required this.id,
    required this.resizePath,
  });

  String city;

  String deviceAssetId;

  String deviceId;

  String id;

  String resizePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CuratedLocationsResponseDto &&
     other.city == city &&
     other.deviceAssetId == deviceAssetId &&
     other.deviceId == deviceId &&
     other.id == id &&
     other.resizePath == resizePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
    (id.hashCode) +
    (resizePath.hashCode);

  @override
  String toString() => 'CuratedLocationsResponseDto[city=$city, deviceAssetId=$deviceAssetId, deviceId=$deviceId, id=$id, resizePath=$resizePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'city'] = this.city;
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
      json[r'id'] = this.id;
      json[r'resizePath'] = this.resizePath;
    return json;
  }

  /// Returns a new [CuratedLocationsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CuratedLocationsResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CuratedLocationsResponseDto(
        city: mapValueOfType<String>(json, r'city')!,
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        id: mapValueOfType<String>(json, r'id')!,
        resizePath: mapValueOfType<String>(json, r'resizePath')!,
      );
    }
    return null;
  }

  static List<CuratedLocationsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CuratedLocationsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CuratedLocationsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CuratedLocationsResponseDto> mapFromJson(dynamic json) {
    final map = <String, CuratedLocationsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CuratedLocationsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CuratedLocationsResponseDto-objects as value to a dart map
  static Map<String, List<CuratedLocationsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CuratedLocationsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CuratedLocationsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'city',
    'deviceAssetId',
    'deviceId',
    'id',
    'resizePath',
  };
}

