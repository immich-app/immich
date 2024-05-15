//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerStatsResponseDto {
  /// Returns a new [ServerStatsResponseDto] instance.
  ServerStatsResponseDto({
    this.photos = 0,
    this.usage = 0,
    this.usageByUser = const [],
    this.videos = 0,
  });

  int photos;

  int usage;

  List<UsageByUserDto> usageByUser;

  int videos;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerStatsResponseDto &&
    other.photos == photos &&
    other.usage == usage &&
    _deepEquality.equals(other.usageByUser, usageByUser) &&
    other.videos == videos;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (photos.hashCode) +
    (usage.hashCode) +
    (usageByUser.hashCode) +
    (videos.hashCode);

  @override
  String toString() => 'ServerStatsResponseDto[photos=$photos, usage=$usage, usageByUser=$usageByUser, videos=$videos]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'photos'] = this.photos;
      json[r'usage'] = this.usage;
      json[r'usageByUser'] = this.usageByUser;
      json[r'videos'] = this.videos;
    return json;
  }

  /// Returns a new [ServerStatsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerStatsResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerStatsResponseDto(
        photos: mapValueOfType<int>(json, r'photos')!,
        usage: mapValueOfType<int>(json, r'usage')!,
        usageByUser: UsageByUserDto.listFromJson(json[r'usageByUser']),
        videos: mapValueOfType<int>(json, r'videos')!,
      );
    }
    return null;
  }

  static List<ServerStatsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerStatsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerStatsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerStatsResponseDto> mapFromJson(dynamic json) {
    final map = <String, ServerStatsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerStatsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerStatsResponseDto-objects as value to a dart map
  static Map<String, List<ServerStatsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerStatsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerStatsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'photos',
    'usage',
    'usageByUser',
    'videos',
  };
}

