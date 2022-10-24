//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerStatsResponseDto {
  /// Returns a new [ServerStatsResponseDto] instance.
  ServerStatsResponseDto({
    required this.photos,
    required this.videos,
    required this.objects,
    required this.usageRaw,
    required this.usage,
    this.usageByUser = const [],
  });

  int photos;

  int videos;

  int objects;

  int usageRaw;

  String usage;

  List<UsageByUserDto> usageByUser;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerStatsResponseDto &&
     other.photos == photos &&
     other.videos == videos &&
     other.objects == objects &&
     other.usageRaw == usageRaw &&
     other.usage == usage &&
     other.usageByUser == usageByUser;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (photos.hashCode) +
    (videos.hashCode) +
    (objects.hashCode) +
    (usageRaw.hashCode) +
    (usage.hashCode) +
    (usageByUser.hashCode);

  @override
  String toString() => 'ServerStatsResponseDto[photos=$photos, videos=$videos, objects=$objects, usageRaw=$usageRaw, usage=$usage, usageByUser=$usageByUser]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'photos'] = photos;
      _json[r'videos'] = videos;
      _json[r'objects'] = objects;
      _json[r'usageRaw'] = usageRaw;
      _json[r'usage'] = usage;
      _json[r'usageByUser'] = usageByUser;
    return _json;
  }

  /// Returns a new [ServerStatsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerStatsResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "ServerStatsResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "ServerStatsResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return ServerStatsResponseDto(
        photos: mapValueOfType<int>(json, r'photos')!,
        videos: mapValueOfType<int>(json, r'videos')!,
        objects: mapValueOfType<int>(json, r'objects')!,
        usageRaw: mapValueOfType<int>(json, r'usageRaw')!,
        usage: mapValueOfType<String>(json, r'usage')!,
        usageByUser: UsageByUserDto.listFromJson(json[r'usageByUser'])!,
      );
    }
    return null;
  }

  static List<ServerStatsResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerStatsResponseDto.listFromJson(entry.value, growable: growable,);
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
    'objects',
    'usageRaw',
    'usage',
    'usageByUser',
  };
}

