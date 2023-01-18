//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetCountByUserIdResponseDto {
  /// Returns a new [AssetCountByUserIdResponseDto] instance.
  AssetCountByUserIdResponseDto({
    this.audio = 0,
    this.photos = 0,
    this.videos = 0,
    this.other = 0,
    this.total = 0,
  });

  int audio;

  int photos;

  int videos;

  int other;

  int total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetCountByUserIdResponseDto &&
     other.audio == audio &&
     other.photos == photos &&
     other.videos == videos &&
     other.other == other &&
     other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (audio.hashCode) +
    (photos.hashCode) +
    (videos.hashCode) +
    (other.hashCode) +
    (total.hashCode);

  @override
  String toString() => 'AssetCountByUserIdResponseDto[audio=$audio, photos=$photos, videos=$videos, other=$other, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'audio'] = this.audio;
      json[r'photos'] = this.photos;
      json[r'videos'] = this.videos;
      json[r'other'] = this.other;
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [AssetCountByUserIdResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetCountByUserIdResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AssetCountByUserIdResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AssetCountByUserIdResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AssetCountByUserIdResponseDto(
        audio: mapValueOfType<int>(json, r'audio')!,
        photos: mapValueOfType<int>(json, r'photos')!,
        videos: mapValueOfType<int>(json, r'videos')!,
        other: mapValueOfType<int>(json, r'other')!,
        total: mapValueOfType<int>(json, r'total')!,
      );
    }
    return null;
  }

  static List<AssetCountByUserIdResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetCountByUserIdResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetCountByUserIdResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetCountByUserIdResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetCountByUserIdResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCountByUserIdResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetCountByUserIdResponseDto-objects as value to a dart map
  static Map<String, List<AssetCountByUserIdResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetCountByUserIdResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetCountByUserIdResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'audio',
    'photos',
    'videos',
    'other',
    'total',
  };
}

