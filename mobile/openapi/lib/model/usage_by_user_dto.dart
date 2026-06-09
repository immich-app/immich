//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UsageByUserDto {
  /// Returns a new [UsageByUserDto] instance.
  UsageByUserDto({
    required this.photos,
    required this.quotaSizeInBytes,
    required this.usage,
    required this.usagePhotos,
    required this.usageVideos,
    required this.userId,
    required this.userName,
    required this.videos,
  });

  /// Number of photos
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int photos;

  /// User quota size in bytes (null if unlimited)
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int? quotaSizeInBytes;

  /// Total storage usage in bytes
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int usage;

  /// Storage usage for photos in bytes
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int usagePhotos;

  /// Storage usage for videos in bytes
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int usageVideos;

  /// User ID
  String userId;

  /// User name
  String userName;

  /// Number of videos
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int videos;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UsageByUserDto &&
    other.photos == photos &&
    other.quotaSizeInBytes == quotaSizeInBytes &&
    other.usage == usage &&
    other.usagePhotos == usagePhotos &&
    other.usageVideos == usageVideos &&
    other.userId == userId &&
    other.userName == userName &&
    other.videos == videos;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (photos.hashCode) +
    (quotaSizeInBytes == null ? 0 : quotaSizeInBytes!.hashCode) +
    (usage.hashCode) +
    (usagePhotos.hashCode) +
    (usageVideos.hashCode) +
    (userId.hashCode) +
    (userName.hashCode) +
    (videos.hashCode);

  @override
  String toString() => 'UsageByUserDto[photos=$photos, quotaSizeInBytes=$quotaSizeInBytes, usage=$usage, usagePhotos=$usagePhotos, usageVideos=$usageVideos, userId=$userId, userName=$userName, videos=$videos]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'photos'] = this.photos;
    if (this.quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = this.quotaSizeInBytes;
    } else {
      json[r'quotaSizeInBytes'] = null;
    }
      json[r'usage'] = this.usage;
      json[r'usagePhotos'] = this.usagePhotos;
      json[r'usageVideos'] = this.usageVideos;
      json[r'userId'] = this.userId;
      json[r'userName'] = this.userName;
      json[r'videos'] = this.videos;
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
        assert(json.containsKey(r'photos'), 'Required key "UsageByUserDto[photos]" is missing from JSON.');
        assert(json[r'photos'] != null, 'Required key "UsageByUserDto[photos]" has a null value in JSON.');
        assert(json.containsKey(r'quotaSizeInBytes'), 'Required key "UsageByUserDto[quotaSizeInBytes]" is missing from JSON.');
        assert(json.containsKey(r'usage'), 'Required key "UsageByUserDto[usage]" is missing from JSON.');
        assert(json[r'usage'] != null, 'Required key "UsageByUserDto[usage]" has a null value in JSON.');
        assert(json.containsKey(r'usagePhotos'), 'Required key "UsageByUserDto[usagePhotos]" is missing from JSON.');
        assert(json[r'usagePhotos'] != null, 'Required key "UsageByUserDto[usagePhotos]" has a null value in JSON.');
        assert(json.containsKey(r'usageVideos'), 'Required key "UsageByUserDto[usageVideos]" is missing from JSON.');
        assert(json[r'usageVideos'] != null, 'Required key "UsageByUserDto[usageVideos]" has a null value in JSON.');
        assert(json.containsKey(r'userId'), 'Required key "UsageByUserDto[userId]" is missing from JSON.');
        assert(json[r'userId'] != null, 'Required key "UsageByUserDto[userId]" has a null value in JSON.');
        assert(json.containsKey(r'userName'), 'Required key "UsageByUserDto[userName]" is missing from JSON.');
        assert(json[r'userName'] != null, 'Required key "UsageByUserDto[userName]" has a null value in JSON.');
        assert(json.containsKey(r'videos'), 'Required key "UsageByUserDto[videos]" is missing from JSON.');
        assert(json[r'videos'] != null, 'Required key "UsageByUserDto[videos]" has a null value in JSON.');
        return true;
      }());

      return UsageByUserDto(
        photos: mapValueOfType<int>(json, r'photos')!,
        quotaSizeInBytes: mapValueOfType<int>(json, r'quotaSizeInBytes'),
        usage: mapValueOfType<int>(json, r'usage')!,
        usagePhotos: mapValueOfType<int>(json, r'usagePhotos')!,
        usageVideos: mapValueOfType<int>(json, r'usageVideos')!,
        userId: mapValueOfType<String>(json, r'userId')!,
        userName: mapValueOfType<String>(json, r'userName')!,
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
    'quotaSizeInBytes',
    'usage',
    'usagePhotos',
    'usageVideos',
    'userId',
    'userName',
    'videos',
  };
}

