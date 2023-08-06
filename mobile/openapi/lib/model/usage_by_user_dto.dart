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
    required this.photos,
    required this.usage,
    required this.userFirstName,
    required this.userId,
    required this.userLastName,
    required this.videos,
  });

  int photos;

  int usage;

  String userFirstName;

  String userId;

  String userLastName;

  int videos;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UsageByUserDto &&
     other.photos == photos &&
     other.usage == usage &&
     other.userFirstName == userFirstName &&
     other.userId == userId &&
     other.userLastName == userLastName &&
     other.videos == videos;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (photos.hashCode) +
    (usage.hashCode) +
    (userFirstName.hashCode) +
    (userId.hashCode) +
    (userLastName.hashCode) +
    (videos.hashCode);

  @override
  String toString() => 'UsageByUserDto[photos=$photos, usage=$usage, userFirstName=$userFirstName, userId=$userId, userLastName=$userLastName, videos=$videos]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'photos'] = this.photos;
      json[r'usage'] = this.usage;
      json[r'userFirstName'] = this.userFirstName;
      json[r'userId'] = this.userId;
      json[r'userLastName'] = this.userLastName;
      json[r'videos'] = this.videos;
    return json;
  }

  /// Returns a new [UsageByUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UsageByUserDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UsageByUserDto(
        photos: mapValueOfType<int>(json, r'photos')!,
        usage: mapValueOfType<int>(json, r'usage')!,
        userFirstName: mapValueOfType<String>(json, r'userFirstName')!,
        userId: mapValueOfType<String>(json, r'userId')!,
        userLastName: mapValueOfType<String>(json, r'userLastName')!,
        videos: mapValueOfType<int>(json, r'videos')!,
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
    'photos',
    'usage',
    'userFirstName',
    'userId',
    'userLastName',
    'videos',
  };
}

