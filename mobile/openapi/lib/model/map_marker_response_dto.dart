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
    required this.type,
    required this.lat,
    required this.lon,
  });

  String id;

  MapMarkerResponseDtoTypeEnum type;

  num lat;

  num lon;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MapMarkerResponseDto &&
     other.id == id &&
     other.type == type &&
     other.lat == lat &&
     other.lon == lon;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (type.hashCode) +
    (lat.hashCode) +
    (lon.hashCode);

  @override
  String toString() => 'MapMarkerResponseDto[id=$id, type=$type, lat=$lat, lon=$lon]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'type'] = this.type;
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
        type: MapMarkerResponseDtoTypeEnum.fromJson(json[r'type'])!,
        lat: json[r'lat'] == null
            ? null
            : num.parse(json[r'lat'].toString()),
        lon: json[r'lon'] == null
            ? null
            : num.parse(json[r'lon'].toString()),
      );
    }
    return null;
  }

  static List<MapMarkerResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MapMarkerResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'type',
    'lat',
    'lon',
  };
}


class MapMarkerResponseDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const MapMarkerResponseDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const IMAGE = MapMarkerResponseDtoTypeEnum._(r'IMAGE');
  static const VIDEO = MapMarkerResponseDtoTypeEnum._(r'VIDEO');
  static const AUDIO = MapMarkerResponseDtoTypeEnum._(r'AUDIO');
  static const OTHER = MapMarkerResponseDtoTypeEnum._(r'OTHER');

  /// List of all possible values in this [enum][MapMarkerResponseDtoTypeEnum].
  static const values = <MapMarkerResponseDtoTypeEnum>[
    IMAGE,
    VIDEO,
    AUDIO,
    OTHER,
  ];

  static MapMarkerResponseDtoTypeEnum? fromJson(dynamic value) => MapMarkerResponseDtoTypeEnumTypeTransformer().decode(value);

  static List<MapMarkerResponseDtoTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MapMarkerResponseDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MapMarkerResponseDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MapMarkerResponseDtoTypeEnum] to String,
/// and [decode] dynamic data back to [MapMarkerResponseDtoTypeEnum].
class MapMarkerResponseDtoTypeEnumTypeTransformer {
  factory MapMarkerResponseDtoTypeEnumTypeTransformer() => _instance ??= const MapMarkerResponseDtoTypeEnumTypeTransformer._();

  const MapMarkerResponseDtoTypeEnumTypeTransformer._();

  String encode(MapMarkerResponseDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a MapMarkerResponseDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MapMarkerResponseDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'IMAGE': return MapMarkerResponseDtoTypeEnum.IMAGE;
        case r'VIDEO': return MapMarkerResponseDtoTypeEnum.VIDEO;
        case r'AUDIO': return MapMarkerResponseDtoTypeEnum.AUDIO;
        case r'OTHER': return MapMarkerResponseDtoTypeEnum.OTHER;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [MapMarkerResponseDtoTypeEnumTypeTransformer] instance.
  static MapMarkerResponseDtoTypeEnumTypeTransformer? _instance;
}


