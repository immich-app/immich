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
    required this.userFirstName,
    required this.userLastName,
    required this.photos,
    required this.videos,
    required this.usage,
  });

  String userId;

  String userFirstName;

  String userLastName;

  int photos;

  int videos;

  int usage;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UsageByUserDto &&
     other.userId == userId &&
     other.userFirstName == userFirstName &&
     other.userLastName == userLastName &&
     other.photos == photos &&
     other.videos == videos &&
     other.usage == usage;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (userId.hashCode) +
    (userFirstName.hashCode) +
    (userLastName.hashCode) +
    (photos.hashCode) +
    (videos.hashCode) +
    (usage.hashCode);

  @override
  String toString() => 'UsageByUserDto[userId=$userId, userFirstName=$userFirstName, userLastName=$userLastName, photos=$photos, videos=$videos, usage=$usage]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'userId'] = this.userId;
      json[r'userFirstName'] = this.userFirstName;
      json[r'userLastName'] = this.userLastName;
      json[r'photos'] = this.photos;
      json[r'videos'] = this.videos;
      json[r'usage'] = this.usage;
    return json;
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
        userFirstName: mapValueOfType<String>(json, r'userFirstName')!,
        userLastName: mapValueOfType<String>(json, r'userLastName')!,
        photos: mapValueOfType<int>(json, r'photos')!,
        videos: mapValueOfType<int>(json, r'videos')!,
        usage: mapValueOfType<int>(json, r'usage')!,
      );
    }
    return null;
  }

  static List<UsageByUserDto> listFromJson(dynamic json, {bool growable = false,}) {
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
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UsageByUserDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'userId',
    'userFirstName',
    'userLastName',
    'photos',
    'videos',
    'usage',
  };
}

