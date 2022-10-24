//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UsageByUserDto {
  /// Returns a new [UsageByUserDto] instance.
  UsageByUserDto({
    required this.userId,
    required this.objects,
    required this.videos,
    required this.photos,
    required this.usageRaw,
    required this.usage,
  });

  String userId;

  int objects;

  int videos;

  int photos;

  int usageRaw;

  String usage;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UsageByUserDto &&
     other.userId == userId &&
     other.objects == objects &&
     other.videos == videos &&
     other.photos == photos &&
     other.usageRaw == usageRaw &&
     other.usage == usage;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (userId.hashCode) +
    (objects.hashCode) +
    (videos.hashCode) +
    (photos.hashCode) +
    (usageRaw.hashCode) +
    (usage.hashCode);

  @override
  String toString() => 'UsageByUserDto[userId=$userId, objects=$objects, videos=$videos, photos=$photos, usageRaw=$usageRaw, usage=$usage]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'userId'] = userId;
      _json[r'objects'] = objects;
      _json[r'videos'] = videos;
      _json[r'photos'] = photos;
      _json[r'usageRaw'] = usageRaw;
      _json[r'usage'] = usage;
    return _json;
  }

  /// Returns a new [UsageByUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UsageByUserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UsageByUserDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UsageByUserDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UsageByUserDto(
        userId: mapValueOfType<String>(json, r'userId')!,
        objects: mapValueOfType<int>(json, r'objects')!,
        videos: mapValueOfType<int>(json, r'videos')!,
        photos: mapValueOfType<int>(json, r'photos')!,
        usageRaw: mapValueOfType<int>(json, r'usageRaw')!,
        usage: mapValueOfType<String>(json, r'usage')!,
      );
    }
    return null;
  }

  static List<UsageByUserDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UsageByUserDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UsageByUserDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UsageByUserDto> mapFromJson(dynamic json) {
    final map = <String, UsageByUserDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UsageByUserDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UsageByUserDto-objects as value to a dart map
  static Map<String, List<UsageByUserDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UsageByUserDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UsageByUserDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'userId',
    'objects',
    'videos',
    'photos',
    'usageRaw',
    'usage',
  };
}

