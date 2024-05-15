//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LibraryStatsResponseDto {
  /// Returns a new [LibraryStatsResponseDto] instance.
  LibraryStatsResponseDto({
    this.photos = 0,
    this.total = 0,
    this.usage = 0,
    this.videos = 0,
  });

  int photos;

  int total;

  int usage;

  int videos;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LibraryStatsResponseDto &&
    other.photos == photos &&
    other.total == total &&
    other.usage == usage &&
    other.videos == videos;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (photos.hashCode) +
    (total.hashCode) +
    (usage.hashCode) +
    (videos.hashCode);

  @override
  String toString() => 'LibraryStatsResponseDto[photos=$photos, total=$total, usage=$usage, videos=$videos]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'photos'] = this.photos;
      json[r'total'] = this.total;
      json[r'usage'] = this.usage;
      json[r'videos'] = this.videos;
    return json;
  }

  /// Returns a new [LibraryStatsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LibraryStatsResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LibraryStatsResponseDto(
        photos: mapValueOfType<int>(json, r'photos')!,
        total: mapValueOfType<int>(json, r'total')!,
        usage: mapValueOfType<int>(json, r'usage')!,
        videos: mapValueOfType<int>(json, r'videos')!,
      );
    }
    return null;
  }

  static List<LibraryStatsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LibraryStatsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LibraryStatsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LibraryStatsResponseDto> mapFromJson(dynamic json) {
    final map = <String, LibraryStatsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LibraryStatsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LibraryStatsResponseDto-objects as value to a dart map
  static Map<String, List<LibraryStatsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LibraryStatsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LibraryStatsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'photos',
    'total',
    'usage',
    'videos',
  };
}

