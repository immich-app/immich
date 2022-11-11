//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetCountResponseDto {
  /// Returns a new [AssetCountResponseDto] instance.
  AssetCountResponseDto({
    required this.photos,
    required this.videos,
  });

  int photos;

  int videos;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetCountResponseDto &&
     other.photos == photos &&
     other.videos == videos;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (photos.hashCode) +
    (videos.hashCode);

  @override
  String toString() => 'AssetCountResponseDto[photos=$photos, videos=$videos]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'photos'] = photos;
      _json[r'videos'] = videos;
    return _json;
  }

  /// Returns a new [AssetCountResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetCountResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AssetCountResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AssetCountResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AssetCountResponseDto(
        photos: mapValueOfType<int>(json, r'photos')!,
        videos: mapValueOfType<int>(json, r'videos')!,
      );
    }
    return null;
  }

  static List<AssetCountResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetCountResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetCountResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetCountResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetCountResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCountResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetCountResponseDto-objects as value to a dart map
  static Map<String, List<AssetCountResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetCountResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCountResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'photos',
    'videos',
  };
}

